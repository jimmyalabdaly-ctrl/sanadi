import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProviderDashboardClient } from "./provider-dashboard-client";

export const dynamic = "force-dynamic";

export default async function ProviderDashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  if (session.user.role !== "PROVIDER") {
    redirect(`/${params.locale}/dashboard`);
  }

  const userId = session.user.id as string;

  const provider = await prisma.providerProfile.findUnique({
    where: { userId },
    include: {
      serviceAreas: true,
      services: { include: { category: true } },
    },
  });

  if (!provider) {
    redirect(`/${params.locale}/become-a-pro`);
  }

  const providerCities = provider.serviceAreas.map((a) => a.city);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [leads, myQuotes, upcomingBookings, monthlyEarnings, reviews, recentActivity] =
    await Promise.all([
      // Open leads in provider's service areas
      prisma.serviceRequest.findMany({
        where: {
          status: "OPEN",
          ...(providerCities.length > 0 ? { city: { in: providerCities } } : {}),
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              firstNameAr: true,
              lastName: true,
              lastNameAr: true,
            },
          },
          category: true,
          quotes: { where: { providerId: userId }, select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // Provider's quotes
      prisma.quote.findMany({
        where: { providerId: userId },
        include: {
          serviceRequest: {
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  firstNameAr: true,
                  lastName: true,
                  lastNameAr: true,
                },
              },
              category: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // Upcoming bookings
      prisma.booking.findMany({
        where: {
          providerId: userId,
          status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              firstNameAr: true,
              lastName: true,
              lastNameAr: true,
            },
          },
          serviceRequest: { include: { category: true } },
        },
        orderBy: { scheduledDate: "asc" },
        take: 10,
      }),

      // Monthly earnings data — last 6 months of completed bookings
      prisma.booking.findMany({
        where: {
          providerId: userId,
          status: "COMPLETED",
          scheduledDate: {
            gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          },
        },
        select: {
          providerEarnings: true,
          scheduledDate: true,
        },
      }),

      // Reviews received
      prisma.review.findMany({
        where: { revieweeId: userId },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              firstNameAr: true,
              lastName: true,
              lastNameAr: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Recent quote activity
      prisma.quote.findMany({
        where: { providerId: userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          serviceRequest: { select: { title: true, titleAr: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  // Compute stats
  const thisMonthBookings = await prisma.booking.findMany({
    where: {
      providerId: userId,
      status: "COMPLETED",
      scheduledDate: { gte: startOfMonth },
    },
    select: { providerEarnings: true },
  });

  const earningsThisMonth = thisMonthBookings.reduce(
    (sum, b) => sum + b.providerEarnings,
    0
  );

  const jobsThisMonth = thisMonthBookings.length;

  const totalEarningsAll = await prisma.booking.aggregate({
    where: { providerId: userId, status: "COMPLETED" },
    _sum: { providerEarnings: true, platformFee: true },
  });

  // Monthly earnings chart data — group by month
  const earningsChart: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    earningsChart[key] = 0;
  }
  monthlyEarnings.forEach((b) => {
    const d = new Date(b.scheduledDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in earningsChart) {
      earningsChart[key] += b.providerEarnings;
    }
  });

  return (
    <ProviderDashboardClient
      provider={JSON.parse(JSON.stringify(provider))}
      leads={JSON.parse(JSON.stringify(leads))}
      myQuotes={JSON.parse(JSON.stringify(myQuotes))}
      upcomingBookings={JSON.parse(JSON.stringify(upcomingBookings))}
      reviews={JSON.parse(JSON.stringify(reviews))}
      recentActivity={JSON.parse(JSON.stringify(recentActivity))}
      earningsChart={earningsChart}
      stats={{
        earningsThisMonth,
        jobsThisMonth,
        newLeads: leads.filter((l) => l.quotes.length === 0).length,
        averageRating: provider.averageRating,
        totalEarnings: totalEarningsAll._sum.providerEarnings ?? 0,
        platformFees: totalEarningsAll._sum.platformFee ?? 0,
      }}
      locale={params.locale}
    />
  );
}
