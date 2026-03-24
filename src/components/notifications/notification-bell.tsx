"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";
import { useNotifications, type AppNotification } from "./notification-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Star,
  Send,
  Calendar,
  MessageSquare,
  DollarSign,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string, locale: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return locale === "ar" ? "الآن" : "just now";
  if (mins < 60)
    return locale === "ar" ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)
    return locale === "ar" ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === "ar" ? `منذ ${days} يوم` : `${days}d ago`;
}

function NotificationIcon({ type }: { type: string }) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "REVIEW_RECEIVED":
      return <Star className={cn(cls, "text-yellow-500")} />;
    case "QUOTE_RECEIVED":
      return <Send className={cn(cls, "text-brand-500")} />;
    case "BOOKING_CONFIRMED":
      return <Calendar className={cn(cls, "text-green-500")} />;
    case "BOOKING_CANCELLED":
      return <Calendar className={cn(cls, "text-red-500")} />;
    case "NEW_MESSAGE":
      return <MessageSquare className={cn(cls, "text-blue-500")} />;
    case "PAYMENT_RECEIVED":
      return <DollarSign className={cn(cls, "text-green-500")} />;
    default:
      return <AlertCircle className={cn(cls, "text-warm-400")} />;
  }
}

function getNotificationUrl(notification: AppNotification, locale: string): string {
  switch (notification.type) {
    case "REVIEW_RECEIVED":
      return `/${locale}/pro/dashboard`;
    case "QUOTE_RECEIVED":
      return `/${locale}/dashboard`;
    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
      return `/${locale}/dashboard`;
    case "NEW_MESSAGE":
      return `/${locale}/dashboard/messages`;
    default:
      return `/${locale}/dashboard`;
  }
}

export function NotificationBell() {
  const { locale, isRtl } = useLocale();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const recent = notifications.slice(0, 10);

  async function handleClick(notification: AppNotification) {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setOpen(false);
    router.push(getNotificationUrl(notification, locale));
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifications">
          <Bell className="h-5 w-5 text-warm-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 h-4 w-4 min-w-[1rem] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center leading-none px-0.5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isRtl ? "start" : "end"}
        className="w-80 max-h-[480px] overflow-hidden flex flex-col p-0"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-warm-100">
          <h3 className="font-heading font-semibold text-sm text-warm-900">
            {locale === "ar" ? "الإشعارات" : "Notifications"}
            {unreadCount > 0 && (
              <span className="ms-2 bg-red-100 text-red-700 text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {locale === "ar" ? "قراءة الكل" : "Mark all read"}
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto flex-1">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-warm-400">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {locale === "ar" ? "لا توجد إشعارات" : "No notifications yet"}
              </p>
            </div>
          ) : (
            <div>
              {recent.map((n, idx) => (
                <div key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-start hover:bg-warm-50 transition-colors",
                      !n.isRead && "bg-brand-50/60"
                    )}
                  >
                    <div className="mt-0.5">
                      <NotificationIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          n.isRead ? "text-warm-600" : "text-warm-900 font-medium"
                        )}
                      >
                        {locale === "ar" ? n.titleAr : n.title}
                      </p>
                      <p className="text-xs text-warm-400 mt-0.5 line-clamp-2">
                        {locale === "ar" ? n.bodyAr : n.body}
                      </p>
                      <p className="text-[10px] text-warm-300 mt-1">
                        {timeAgo(n.createdAt, locale)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                    )}
                  </button>
                  {idx < recent.length - 1 && (
                    <DropdownMenuSeparator className="my-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
