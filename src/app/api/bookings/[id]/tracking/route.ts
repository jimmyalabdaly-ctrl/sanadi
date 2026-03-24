export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TRACKING_ORDER = ["confirmed", "en_route", "arrived", "in_progress", "completed"] as const;
type TrackingStatus = typeof TRACKING_ORDER[number];

function getStatusIndex(status: string | null | undefined): number {
  if (!status) return 0;
  return TRACKING_ORDER.indexOf(status as TrackingStatus);
}

const notificationMessages: Record<TrackingStatus, { titleEn: string; titleAr: string; bodyEn: string; bodyAr: string }> = {
  confirmed: {
    titleEn: "Booking Confirmed",
    titleAr: "تم تأكيد الحجز",
    bodyEn: "Your booking has been confirmed.",
    bodyAr: "تم تأكيد حجزك.",
  },
  en_route: {
    titleEn: "Provider On The Way",
    titleAr: "المزود في الطريق إليك",
    bodyEn: "Your provider is on the way to your location.",
    bodyAr: "المزود في طريقه إلى موقعك.",
  },
  arrived: {
    titleEn: "Provider Has Arrived",
    titleAr: "وصل المزود",
    bodyEn: "Your provider has arrived at your location.",
    bodyAr: "وصل المزود إلى موقعك.",
  },
  in_progress: {
    titleEn: "Work In Progress",
    titleAr: "العمل جارٍ",
    bodyEn: "Work has started on your service request.",
    bodyAr: "بدأ العمل على طلب خدمتك.",
  },
  completed: {
    titleEn: "Work Completed",
    titleAr: "اكتمل العمل",
    bodyEn: "Your service has been completed. Please confirm and leave a review.",
    bodyAr: "اكتملت خدمتك. يرجى التأكيد وترك تقييم.",
  },
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        trackingStatus: true,
        customerId: true,
        providerId: true,
        updatedAt: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only customer or provider can view tracking
    if (booking.customerId !== session.user.id && booking.providerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      bookingId: booking.id,
      trackingStatus: booking.trackingStatus ?? "confirmed",
      bookingStatus: booking.status,
      updatedAt: booking.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching tracking status:", error);
    return NextResponse.json({ error: "Failed to fetch tracking status" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only providers can update tracking status
    if (session.user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Only providers can update tracking status" }, { status: 403 });
    }

    const body = await request.json();
    const { trackingStatus } = body as { trackingStatus: string };

    if (!TRACKING_ORDER.includes(trackingStatus as TrackingStatus)) {
      return NextResponse.json(
        { error: `Invalid tracking status. Must be one of: ${TRACKING_ORDER.join(", ")}` },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        providerId: true,
        customerId: true,
        trackingStatus: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.providerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Enforce forward-only progression
    const currentIndex = getStatusIndex(booking.trackingStatus ?? "confirmed");
    const newIndex = getStatusIndex(trackingStatus);

    if (newIndex <= currentIndex) {
      return NextResponse.json(
        { error: "Cannot go back to a previous status" },
        { status: 400 }
      );
    }

    // Update tracking status on booking
    const updateData: Record<string, unknown> = { trackingStatus };

    // Sync booking status when work starts or completes
    if (trackingStatus === "in_progress") {
      updateData.status = "IN_PROGRESS";
      updateData.actualStartTime = new Date();
    }
    if (trackingStatus === "completed") {
      updateData.status = "COMPLETED";
      updateData.actualEndTime = new Date();
      updateData.providerConfirmedCompletion = true;
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
    });

    // Create a notification for the customer
    const msgs = notificationMessages[trackingStatus as TrackingStatus];
    await prisma.notification.create({
      data: {
        userId: booking.customerId,
        type: "BOOKING_CONFIRMED",
        title: msgs.titleEn,
        titleAr: msgs.titleAr,
        body: msgs.bodyEn,
        bodyAr: msgs.bodyAr,
        data: { bookingId: booking.id, trackingStatus },
      },
    });

    return NextResponse.json({
      bookingId: updated.id,
      trackingStatus: updated.trackingStatus,
      bookingStatus: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("Error updating tracking status:", error);
    return NextResponse.json({ error: "Failed to update tracking status" }, { status: 500 });
  }
}
