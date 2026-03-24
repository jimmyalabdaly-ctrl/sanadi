"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type CountdownTimerProps = {
  expiresAt: Date | string;
  locale?: string;
  className?: string;
};

type TimeLeft = {
  total: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(expiresAt: Date | string): TimeLeft {
  const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const total = expiry.getTime() - Date.now();
  if (total <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 };
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  return { total, hours, minutes, seconds };
}

export function CountdownTimer({ expiresAt, locale = "en", className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(expiresAt));

  useEffect(() => {
    // Recalculate on expiresAt changes
    setTimeLeft(getTimeLeft(expiresAt));

    const interval = setInterval(() => {
      const tl = getTimeLeft(expiresAt);
      setTimeLeft(tl);
      if (tl.total <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = timeLeft.total <= 0;
  const isUnder10Min = !isExpired && timeLeft.total < 10 * 60_000;
  const isUnder30Min = !isExpired && timeLeft.total < 30 * 60_000;

  function formatTime(): string {
    if (isExpired) {
      return locale === "ar" ? "منتهي" : "Expired";
    }
    if (isUnder10Min) {
      if (locale === "ar") {
        return `${timeLeft.minutes}د ${timeLeft.seconds}ث متبقية`;
      }
      return `${timeLeft.minutes}m ${timeLeft.seconds}s remaining`;
    }
    if (timeLeft.hours > 0) {
      if (locale === "ar") {
        return `${timeLeft.hours}س ${timeLeft.minutes}د متبقية`;
      }
      return `${timeLeft.hours}h ${timeLeft.minutes}m remaining`;
    }
    if (locale === "ar") {
      return `${timeLeft.minutes}د ${timeLeft.seconds}ث متبقية`;
    }
    return `${timeLeft.minutes}m ${timeLeft.seconds}s remaining`;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
        isExpired
          ? "text-warm-400 bg-warm-100"
          : isUnder10Min
          ? "text-red-700 bg-red-100"
          : isUnder30Min
          ? "text-amber-700 bg-amber-100"
          : "text-green-700 bg-green-100",
        className
      )}
    >
      <Clock className="h-3 w-3 shrink-0" />
      {formatTime()}
    </span>
  );
}
