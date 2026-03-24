"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "@/hooks/use-locale";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refresh: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

function getNotificationUrl(notification: AppNotification, locale: string): string {
  const data = notification.data as { bookingId?: string; reviewId?: string } | undefined;
  switch (notification.type) {
    case "REVIEW_RECEIVED":
      return `/${locale}/pro/dashboard`;
    case "QUOTE_RECEIVED":
      return `/${locale}/dashboard`;
    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
      return data?.bookingId ? `/${locale}/dashboard` : `/${locale}/dashboard`;
    case "NEW_MESSAGE":
      return `/${locale}/dashboard/messages`;
    default:
      return `/${locale}/dashboard`;
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const { toast } = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenIdRef = useRef<string | null>(null);
  const isFirstFetchRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const fetched: AppNotification[] = data.notifications ?? [];

      setNotifications(fetched);
      setUnreadCount(data.unreadCount ?? 0);

      // Show toasts for newly arrived notifications (skip on initial fetch)
      if (!isFirstFetchRef.current && fetched.length > 0) {
        const lastSeenId = lastSeenIdRef.current;
        const newOnes = lastSeenId
          ? fetched.filter(
              (n) => !n.isRead && new Date(n.createdAt) > new Date(fetched.find((x) => x.id === lastSeenId)?.createdAt ?? 0)
            )
          : [];
        for (const n of newOnes.slice(0, 3)) {
          const title = locale === "ar" ? n.titleAr : n.title;
          const body = locale === "ar" ? n.bodyAr : n.body;
          const url = getNotificationUrl(n, locale);
          toast({
            title,
            description: body,
            action: (
              <button
                onClick={() => router.push(url)}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                {locale === "ar" ? "عرض" : "View"}
              </button>
            ),
          });
        }
      }

      if (fetched.length > 0) {
        lastSeenIdRef.current = fetched[0].id;
      }
      isFirstFetchRef.current = false;
    } catch {
      // silently fail
    }
  }, [session?.user?.id, locale, toast, router]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  const refresh = useCallback(() => {
    isFirstFetchRef.current = false;
    fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session?.user?.id, fetchNotifications]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!session?.user?.id) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30_000);
    return () => clearInterval(interval);
  }, [session?.user?.id, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}
