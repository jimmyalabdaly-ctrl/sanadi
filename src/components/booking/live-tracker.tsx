"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, Navigation, MapPin, Wrench, PartyPopper, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type TrackingStatus = "confirmed" | "en_route" | "arrived" | "in_progress" | "completed";

interface TrackingStep {
  status: TrackingStatus;
  labelEn: string;
  labelAr: string;
  messageEn: string;
  messageAr: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: TrackingStep[] = [
  {
    status: "confirmed",
    labelEn: "Confirmed",
    labelAr: "مؤكد",
    messageEn: "Your booking is confirmed",
    messageAr: "تم تأكيد حجزك",
    icon: CheckCircle,
  },
  {
    status: "en_route",
    labelEn: "On The Way",
    labelAr: "في الطريق",
    messageEn: "Your provider is on the way!",
    messageAr: "المزود في طريقه إليك!",
    icon: Navigation,
  },
  {
    status: "arrived",
    labelEn: "Arrived",
    labelAr: "وصل",
    messageEn: "Your provider has arrived",
    messageAr: "وصل المزود",
    icon: MapPin,
  },
  {
    status: "in_progress",
    labelEn: "In Progress",
    labelAr: "جارٍ العمل",
    messageEn: "Work is in progress",
    messageAr: "العمل جارٍ",
    icon: Wrench,
  },
  {
    status: "completed",
    labelEn: "Completed",
    labelAr: "مكتمل",
    messageEn: "Work completed! Please confirm and leave a review",
    messageAr: "اكتمل العمل! يرجى التأكيد وترك تقييم",
    icon: PartyPopper,
  },
];

const STATUS_ORDER: TrackingStatus[] = ["confirmed", "en_route", "arrived", "in_progress", "completed"];

function getStatusIndex(status: string): number {
  return STATUS_ORDER.indexOf(status as TrackingStatus);
}

interface LiveTrackerProps {
  bookingId: string;
  initialTrackingStatus?: string;
  locale?: string;
  reviewUrl?: string;
}

export function LiveTracker({
  bookingId,
  initialTrackingStatus = "confirmed",
  locale = "en",
  reviewUrl,
}: LiveTrackerProps) {
  const isAr = locale === "ar";
  const [trackingStatus, setTrackingStatus] = useState<string>(initialTrackingStatus);
  const [loading, setLoading] = useState(false);

  // Poll for status updates every 30s when booking is active
  useEffect(() => {
    const currentIndex = getStatusIndex(trackingStatus);
    if (currentIndex >= STATUS_ORDER.length - 1) return; // completed, no need to poll

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/tracking`);
        if (res.ok) {
          const data = await res.json();
          if (data.trackingStatus) {
            setTrackingStatus(data.trackingStatus);
          }
        }
      } catch {
        // silently fail polling
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [bookingId, trackingStatus]);

  const currentIndex = getStatusIndex(trackingStatus);
  const currentStep = STEPS[currentIndex] ?? STEPS[0];

  return (
    <div className="space-y-4">
      {/* Current status message */}
      <div className="flex items-center gap-3 p-3 rounded-[10px] bg-brand-50 border border-brand-100">
        <div className="relative">
          <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center">
            {(() => {
              const Icon = currentStep.icon;
              return <Icon className="h-4 w-4 text-white" />;
            })()}
          </div>
          {currentIndex < STATUS_ORDER.length - 1 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-500 animate-ping" />
          )}
        </div>
        <p className="text-sm font-semibold text-brand-700">
          {isAr ? currentStep.messageAr : currentStep.messageEn}
        </p>
      </div>

      {/* Stepper */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-4 start-4 end-4 h-0.5 bg-warm-200" />
        <div
          className="absolute top-4 start-4 h-0.5 bg-brand-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isFuture = i > currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.status} className="flex flex-col items-center gap-1.5 w-12">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full border-2 flex items-center justify-center z-10 relative transition-all duration-300",
                    isDone && "bg-green-500 border-green-500",
                    isCurrent && "bg-brand-500 border-brand-500",
                    isFuture && "bg-white border-warm-300"
                  )}
                >
                  {isDone ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isCurrent && "text-white",
                        isFuture && "text-warm-300"
                      )}
                    />
                  )}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full bg-brand-400 animate-ping opacity-40" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium text-center leading-tight",
                    isDone && "text-green-600",
                    isCurrent && "text-brand-600",
                    isFuture && "text-warm-400"
                  )}
                >
                  {isAr ? step.labelAr : step.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed state: prompt for review */}
      {trackingStatus === "completed" && reviewUrl && (
        <Link href={reviewUrl}>
          <Button className="w-full mt-2" size="sm">
            <PartyPopper className="h-4 w-4 me-2" />
            {isAr ? "تأكيد وترك تقييم" : "Confirm & Leave Review"}
          </Button>
        </Link>
      )}
    </div>
  );
}

// Provider-facing tracking controls component
interface TrackingControlsProps {
  bookingId: string;
  initialTrackingStatus?: string;
  locale?: string;
  onStatusChange?: (newStatus: string) => void;
}

const PROVIDER_BUTTON_LABELS: Record<TrackingStatus, { en: string; ar: string }> = {
  confirmed: { en: "I'm On My Way", ar: "أنا في الطريق" },
  en_route: { en: "I've Arrived", ar: "وصلت" },
  arrived: { en: "Starting Work", ar: "بدء العمل" },
  in_progress: { en: "Work Complete", ar: "العمل مكتمل" },
  completed: { en: "Completed", ar: "مكتمل" },
};

const NEXT_STATUS: Record<TrackingStatus, TrackingStatus | null> = {
  confirmed: "en_route",
  en_route: "arrived",
  arrived: "in_progress",
  in_progress: "completed",
  completed: null,
};

export function TrackingControls({
  bookingId,
  initialTrackingStatus = "confirmed",
  locale = "en",
  onStatusChange,
}: TrackingControlsProps) {
  const isAr = locale === "ar";
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>(
    (initialTrackingStatus as TrackingStatus) ?? "confirmed"
  );
  const [updating, setUpdating] = useState(false);

  const nextStatus = NEXT_STATUS[trackingStatus];

  async function handleAdvance() {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingStatus: nextStatus }),
      });
      if (res.ok) {
        setTrackingStatus(nextStatus);
        onStatusChange?.(nextStatus);
      }
    } finally {
      setUpdating(false);
    }
  }

  if (trackingStatus === "completed") {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle className="h-4 w-4" />
        {isAr ? "مكتمل" : "Completed"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <LiveTracker
        bookingId={bookingId}
        initialTrackingStatus={trackingStatus}
        locale={locale}
      />
      {nextStatus && (
        <Button
          size="sm"
          className="w-full"
          onClick={handleAdvance}
          disabled={updating}
        >
          {updating ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : null}
          {isAr
            ? PROVIDER_BUTTON_LABELS[trackingStatus].ar
            : PROVIDER_BUTTON_LABELS[trackingStatus].en}
        </Button>
      )}
    </div>
  );
}
