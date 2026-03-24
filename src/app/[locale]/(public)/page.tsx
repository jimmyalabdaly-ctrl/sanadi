import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import HomeClient from "./home-client";
import type { CategoryData, ProviderData, ReviewData, StatsData } from "./home-client";

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    const [categoriesRaw, providersRaw, reviewsRaw, userCount, providerCount, completedBookings, cityResult] =
      await Promise.all([
        prisma.serviceCategory.findMany({
          where: { isActive: true, parentCategoryId: null },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true,
            icon: true,
            averagePriceMin: true,
            averagePriceMax: true,
            _count: { select: { providerServices: true } },
          },
        }),
        prisma.providerProfile.findMany({
          where: { isActive: true, isSuspended: false },
          orderBy: { averageRating: "desc" },
          take: 6,
          select: {
            id: true,
            slug: true,
            businessName: true,
            businessNameAr: true,
            averageRating: true,
            totalJobsCompleted: true,
            totalReviews: true,
            responseTime: true,
            identityVerified: true,
            instantBookEnabled: true,
            tier: true,
            user: {
              select: {
                id: true,
                firstName: true,
                firstNameAr: true,
                lastName: true,
                lastNameAr: true,
                avatar: true,
                city: true,
              },
            },
            services: {
              take: 1,
              include: {
                category: {
                  select: { name: true, nameAr: true, slug: true },
                },
              },
            },
          },
        }),
        prisma.review.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          where: {
            comment: { not: null },
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            commentAr: true,
            createdAt: true,
            reviewer: {
              select: {
                firstName: true,
                firstNameAr: true,
                lastName: true,
                lastNameAr: true,
                city: true,
                avatar: true,
              },
            },
            reviewee: {
              select: {
                firstName: true,
                firstNameAr: true,
              },
            },
          },
        }),
        prisma.user.count(),
        prisma.providerProfile.count({ where: { isActive: true, isSuspended: false } }),
        prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
        prisma.providerServiceArea.findMany({
          select: { city: true },
          distinct: ["city"],
        }),
      ]);

    const categories: CategoryData[] = categoriesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      nameAr: c.nameAr,
      slug: c.slug,
      icon: c.icon,
      averagePriceMin: c.averagePriceMin,
      averagePriceMax: c.averagePriceMax,
      _count: { providerServices: c._count.providerServices },
    }));

    const providers: ProviderData[] = providersRaw.map((p) => ({
      id: p.id,
      slug: p.slug,
      businessName: p.businessName,
      businessNameAr: p.businessNameAr,
      averageRating: p.averageRating,
      totalJobsCompleted: p.totalJobsCompleted,
      totalReviews: p.totalReviews,
      responseTime: p.responseTime,
      identityVerified: p.identityVerified,
      instantBookEnabled: p.instantBookEnabled,
      tier: p.tier,
      user: {
        id: p.user.id,
        firstName: p.user.firstName,
        firstNameAr: p.user.firstNameAr,
        lastName: p.user.lastName,
        lastNameAr: p.user.lastNameAr,
        avatar: p.user.avatar,
        city: p.user.city,
      },
      services: p.services.map((s) => ({
        category: {
          name: s.category.name,
          nameAr: s.category.nameAr,
          slug: s.category.slug,
        },
      })),
    }));

    const reviews: ReviewData[] = reviewsRaw.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      commentAr: r.commentAr,
      createdAt: r.createdAt.toISOString(),
      reviewer: {
        firstName: r.reviewer.firstName,
        firstNameAr: r.reviewer.firstNameAr,
        lastName: r.reviewer.lastName,
        lastNameAr: r.reviewer.lastNameAr,
        city: r.reviewer.city,
        avatar: r.reviewer.avatar,
      },
      reviewee: {
        firstName: r.reviewee.firstName,
        firstNameAr: r.reviewee.firstNameAr,
      },
    }));

    const stats: StatsData = {
      users: userCount,
      providers: providerCount,
      completedBookings,
      cities: cityResult.length,
    };

    return { categories, providers, reviews, stats };
  } catch (error) {
    console.error("Failed to fetch home page data:", error);
    return {
      categories: [] as CategoryData[],
      providers: [] as ProviderData[],
      reviews: [] as ReviewData[],
      stats: { users: 0, providers: 0, completedBookings: 0, cities: 0 } as StatsData,
    };
  }
}

export default async function HomePage() {
  const { categories, providers, reviews, stats } = await getHomeData();

  return (
    <HomeClient
      categories={categories}
      providers={providers}
      reviews={reviews}
      stats={stats}
    />
  );
}
