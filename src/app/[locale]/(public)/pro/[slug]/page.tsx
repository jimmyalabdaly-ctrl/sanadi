import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProviderProfileClient from "./provider-profile-client";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // Fetch from DB — match by slug or userId
  const provider = await prisma.providerProfile.findFirst({
    where: {
      OR: [{ slug }, { userId: slug }],
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
            select: { id: true, name: true, nameAr: true, slug: true, icon: true },
          },
        },
      },
      serviceAreas: true,
    },
  });

  if (!provider) notFound();

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

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct =
      reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { stars: star, count, pct };
  });

  // Category averages from reviews
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

  // Serialize for client (convert Dates to strings)
  const providerData = JSON.parse(JSON.stringify(provider));
  const reviewsData = JSON.parse(JSON.stringify(reviews));

  return (
    <ProviderProfileClient
      provider={providerData}
      reviews={reviewsData}
      ratingDistribution={ratingDistribution}
      categoryAverages={categoryAverages}
      locale={locale}
    />
  );
}
