export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find by slug first, then by userId
    const provider = await prisma.providerProfile.findFirst({
      where: {
        OR: [{ slug: id }, { userId: id }],
        isActive: true,
        isSuspended: false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            firstNameAr: true,
            lastName: true,
            lastNameAr: true,
            avatar: true,
            bio: true,
            bioAr: true,
            city: true,
            area: true,
            phone: true,
            isVerified: true,
            isPhoneVerified: true,
            createdAt: true,
          },
        },
        services: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                slug: true,
                icon: true,
              },
            },
          },
        },
        serviceAreas: true,
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Fetch reviews separately with reviewer info
    const reviews = await prisma.review.findMany({
      where: { revieweeId: provider.userId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            firstNameAr: true,
            lastName: true,
            lastNameAr: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            id: true,
            scheduledDate: true,
            serviceRequest: {
              select: {
                category: { select: { name: true, nameAr: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute rating distribution from reviews
    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length;
      const pct =
        reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
      return { stars: star, count, pct };
    });

    // Compute category averages from review categories JSON
    const categoryTotals = { punctuality: 0, quality: 0, communication: 0, value: 0 };
    let categoryCount = 0;
    for (const review of reviews) {
      if (review.categories && typeof review.categories === "object") {
        const cats = review.categories as Record<string, number>;
        if (cats.punctuality) categoryTotals.punctuality += cats.punctuality;
        if (cats.quality) categoryTotals.quality += cats.quality;
        if (cats.communication) categoryTotals.communication += cats.communication;
        if (cats.value) categoryTotals.value += cats.value;
        categoryCount++;
      }
    }
    const categoryAverages =
      categoryCount > 0
        ? {
            punctuality: parseFloat((categoryTotals.punctuality / categoryCount).toFixed(1)),
            quality: parseFloat((categoryTotals.quality / categoryCount).toFixed(1)),
            communication: parseFloat((categoryTotals.communication / categoryCount).toFixed(1)),
            value: parseFloat((categoryTotals.value / categoryCount).toFixed(1)),
          }
        : { punctuality: 0, quality: 0, communication: 0, value: 0 };

    return NextResponse.json({
      provider,
      reviews,
      ratingDistribution,
      categoryAverages,
    });
  } catch (error) {
    console.error("Error fetching provider:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    );
  }
}
