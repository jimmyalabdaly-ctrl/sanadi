"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Image as ImageIcon, Paperclip, Search, CheckCheck, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type ConvUser = {
  id: string;
  firstName: string;
  firstNameAr: string;
  lastName: string;
  lastNameAr: string;
  avatar?: string;
};

type Participant = {
  userId: string;
  user: ConvUser;
};

type LastMessage = {
  content: string;
  createdAt: string;
  senderId: string;
};

type Conversation = {
  id: string;
  lastMessageAt: string;
  participants: Participant[];
  messages: LastMessage[];
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: ConvUser;
};

export default function MessagesPage() {
  const t = useTranslations("chat");
  const { locale } = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/login`);
    }
  }, [status, locale, router]);

  const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
    }
  }, [status, fetchConversations]);

  // When conversation is selected, fetch messages and start polling
  useEffect(() => {
    if (!selectedConvId) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    fetchMessages(selectedConvId);

    // Poll every 5 seconds for new messages
    pollRef.current = setInterval(() => {
      fetchMessages(selectedConvId);
      fetchConversations();
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedConvId, fetchMessages, fetchConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedConvId || sending) return;
    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: userId ?? "",
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId ?? "",
        firstName: (session?.user?.name ?? "").split(" ")[0] ?? "",
        firstNameAr: "",
        lastName: (session?.user?.name ?? "").split(" ")[1] ?? "",
        lastNameAr: "",
      },
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvId, content }),
      });
      if (res.ok) {
        // Refetch to get server-confirmed message
        await fetchMessages(selectedConvId);
        await fetchConversations();
      }
    } catch {
      // remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  }

  function getOtherParticipant(conv: Conversation): ConvUser | null {
    if (!userId) return null;
    return conv.participants.find((p) => p.userId !== userId)?.user ?? null;
  }

  function getDisplayName(user: ConvUser) {
    return locale === "ar"
      ? `${user.firstNameAr || user.firstName} ${user.lastNameAr || user.lastName}`.trim()
      : `${user.firstName} ${user.lastName}`.trim();
  }

  function getInitials(user: ConvUser) {
    return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return locale === "ar" ? "الآن" : "now";
    if (diffMins < 60) return locale === "ar" ? `${diffMins}د` : `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return locale === "ar" ? `${diffHours}س` : `${diffHours}h`;
    return date.toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", { month: "short", day: "numeric" });
  }

  function formatMsgTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString(locale === "ar" ? "ar-JO" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!search) return true;
    const other = getOtherParticipant(conv);
    if (!other) return false;
    return getDisplayName(other).toLowerCase().includes(search.toLowerCase());
  });

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const otherParticipant = selectedConv ? getOtherParticipant(selectedConv) : null;

  const unreadCount = (conv: Conversation) =>
    conv.messages.filter((m) => m.senderId !== userId && !m.isRead).length;

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-card shadow-soft border border-warm-100 h-[calc(100vh-180px)] flex items-center justify-center text-warm-400">
          {locale === "ar" ? "جاري التحميل..." : "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-card shadow-soft border border-warm-100 h-[calc(100vh-180px)] flex overflow-hidden">
        {/* Conversations List */}
        <div
          className={cn(
            "w-full md:w-80 border-e border-warm-100 flex flex-col",
            selectedConvId !== null && "hidden md:flex"
          )}
        >
          <div className="p-4 border-b border-warm-100">
            <h2 className="font-heading font-semibold text-warm-900 mb-3">{t("conversations")}</h2>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={locale === "ar" ? "بحث..." : "Search..."}
                className="ps-9 h-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loadingConvs && (
              <div className="p-8 text-center text-warm-400 text-sm">
                {locale === "ar" ? "جاري التحميل..." : "Loading..."}
              </div>
            )}
            {!loadingConvs && filteredConversations.length === 0 && (
              <div className="p-8 text-center text-warm-400 text-sm">
                {t("noConversations")}
              </div>
            )}
            {filteredConversations.map((conv) => {
              const other = getOtherParticipant(conv);
              if (!other) return null;
              const lastMsg = conv.messages[0];
              const unread = unreadCount(conv);

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 border-b border-warm-50 hover:bg-warm-50 transition-colors text-start",
                    selectedConvId === conv.id && "bg-brand-50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-brand-100 text-brand-700 text-sm">
                        {getInitials(other)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-warm-900">
                        {getDisplayName(other)}
                      </span>
                      <span className="text-[10px] text-warm-400">
                        {lastMsg ? formatTime(lastMsg.createdAt) : formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-warm-500 truncate">
                      {lastMsg?.content ?? (locale === "ar" ? "لا رسائل" : "No messages")}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="bg-brand-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConvId !== null ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-warm-100">
              <button className="md:hidden" onClick={() => setSelectedConvId(null)}>
                <ArrowLeft className="h-5 w-5 text-warm-600" />
              </button>
              {otherParticipant && (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-brand-100 text-brand-700 text-xs">
                      {getInitials(otherParticipant)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm text-warm-900">
                      {getDisplayName(otherParticipant)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMsgs && messages.length === 0 && (
                <div className="text-center text-warm-400 text-sm py-8">
                  {locale === "ar" ? "جاري التحميل..." : "Loading messages..."}
                </div>
              )}
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-2.5 rounded-[16px] text-sm",
                          isMe
                            ? "bg-brand-500 text-white rounded-ee-[4px]"
                            : "bg-warm-100 text-warm-900 rounded-es-[4px]"
                        )}
                      >
                        <p>{msg.content}</p>
                        <div
                          className={cn(
                            "flex items-center gap-1 justify-end mt-1",
                            isMe ? "text-brand-200" : "text-warm-400"
                          )}
                        >
                          <span className="text-[10px]">{formatMsgTime(msg.createdAt)}</span>
                          {isMe && (
                            <CheckCheck className={cn("h-3 w-3", msg.isRead ? "text-blue-300" : "")} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-warm-100">
              <div className="flex items-center gap-2">
                <button className="p-2 text-warm-400 hover:text-warm-600">
                  <Paperclip className="h-5 w-5" />
                </button>
                <button className="p-2 text-warm-400 hover:text-warm-600">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t("typeMessage")}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="rounded-full"
                  disabled={!newMessage.trim() || sending}
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-warm-400">
            <p>{t("noConversations")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
