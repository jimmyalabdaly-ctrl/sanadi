import { prisma } from "@/lib/prisma";
import BecomeAProClient from "./become-a-pro-client";

async function getStats() {
  try {
    const [providerCount, activeRequestCount, earningsAgg] = await Promise.all([
      prisma.providerProfile.count({ where: { isActive: true, isSuspended: false } }),
      prisma.serviceRequest.count({ where: { status: "OPEN" } }),
      prisma.booking.aggregate({
        where: { status: "COMPLETED" },
        _avg: { providerEarnings: true },
        _sum: { providerEarnings: true },
      }),
    ]);

    const avgMonthlyEarnings =
      earningsAgg._avg.providerEarnings
        ? Math.round(earningsAgg._avg.providerEarnings * 20) // approx 20 bookings/month
        : 500;

    return {
      providerCount,
      activeRequestCount,
      avgMonthlyEarnings,
    };
  } catch {
    return {
      providerCount: 2500,
      activeRequestCount: 1200,
      avgMonthlyEarnings: 500,
    };
  }
}

export default async function BecomeAProPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const stats = await getStats();

  return <BecomeAProClient stats={stats} locale={locale} />;
}
