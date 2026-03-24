export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    const where: Record<string, unknown> = {};
    if (providerId) where.revieweeId = providerId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, avatar: true } },
        booking: { include: { serviceRequest: { include: { category: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, rating, title, titleAr, comment, commentAr, categories, images } = body;

    if (!bookingId || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (comment.trim().length < 10) {
      return NextResponse.json({ error: "Comment must be at least 10 characters" }, { status: 400 });
    }

    // Validate booking belongs to authenticated customer
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceRequest: { select: { title: true, titleAr: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.customerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent duplicate reviews
    const existingReview = await prisma.review.findUnique({ where: { bookingId } });
    if (existingReview) {
      return NextResponse.json({ error: "Review already submitted for this booking" }, { status: 409 });
    }

    const revieweeId = booking.providerId;

    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: session.user.id,
        revieweeId,
        rating,
        title,
        titleAr,
        comment,
        commentAr,
        categories: categories ?? {},
        images: images || [],
      },
    });

    // Update provider's averageRating and totalReviews
    const allReviews = await prisma.review.findMany({ where: { revieweeId } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.providerProfile.updateMany({
      where: { userId: revieweeId },
      data: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      },
    });

    // Notify the provider
    const reviewerUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, firstNameAr: true, lastName: true },
    });
    const reviewerName = reviewerUser
      ? `${reviewerUser.firstName} ${reviewerUser.lastName}`
      : "A customer";
    const reviewerNameAr = reviewerUser
      ? `${reviewerUser.firstNameAr || reviewerUser.firstName} ${reviewerUser.lastName}`
      : "أحد العملاء";
    const serviceTitle = booking.serviceRequest?.title ?? "Service";
    const serviceTitleAr = booking.serviceRequest?.titleAr ?? "الخدمة";

    await prisma.notification.create({
      data: {
        userId: revieweeId,
        type: "REVIEW_RECEIVED",
        title: `New review from ${reviewerName}`,
        titleAr: `تقييم جديد من ${reviewerNameAr}`,
        body: `${reviewerName} left you a ${rating}-star review for "${serviceTitle}"`,
        bodyAr: `${reviewerNameAr} ترك لك تقييم ${rating} نجوم لـ "${serviceTitleAr}"`,
        data: { reviewId: review.id, bookingId, rating },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
