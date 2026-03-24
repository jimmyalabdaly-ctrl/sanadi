"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface RealtimeMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string | null;
  content: string;
  attachments: string[];
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    firstNameAr: string;
    lastName: string;
    lastNameAr: string;
    avatar: string | null;
  };
}

export function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial messages via REST API
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime inserts
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as RealtimeMessage;
          setMessages((prev) => {
            // Avoid duplicates (optimistic update may have added it already)
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, attachments: string[] = []) => {
      if (!conversationId) return;

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content, attachments }),
        });

        if (!res.ok) throw new Error("Failed to send message");

        const data = await res.json();

        // Optimistic update
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    },
    [conversationId]
  );

  return { messages, isLoading, sendMessage, refetch: fetchMessages };
}
