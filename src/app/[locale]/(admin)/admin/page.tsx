import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/${params.locale}/dashboard`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalUsers,
    totalProviders,
    activeRequests,
    bookingsToday,
    openDisputes,
    revenueResult,
    users,
    disputes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.providerProfile.count(),
    prisma.serviceRequest.count({ where: { status: "OPEN" } }),
    prisma.booking.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { status: "COMPLETED" },
    }),
    prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        providerProfile: {
          select: {
            id: true,
            businessName: true,
            identityVerified: true,
            isActive: true,
            isSuspended: true,
            tier: true,
          },
        },
      },
    }),
    prisma.report.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            firstNameAr: true,
            lastName: true,
            lastNameAr: true,
            email: true,
          },
        },
        reported: {
          select: {
            id: true,
            firstName: true,
            firstNameAr: true,
            lastName: true,
            lastNameAr: true,
            email: true,
          },
        },
        booking: { select: { id: true, totalPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // User growth: last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true },
  });

  // Build 12-month growth map
  const monthlyGrowth: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyGrowth[key] = 0;
  }
  recentUsers.forEach((u) => {
    const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyGrowth) monthlyGrowth[key] += 1;
  });

  // Bookings by category
  const bookingsByCategory = await prisma.serviceRequest.groupBy({
    by: ["categoryId"],
    _count: { id: true },
    where: { status: { not: "OPEN" } },
    orderBy: { _count: { id: "desc" } },
    take: 6,
  });

  const categoryIds = bookingsByCategory.map((b) => b.categoryId);
  const categories =
    categoryIds.length > 0
      ? await prisma.serviceCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, nameAr: true },
        })
      : [];

  const totalCategoryCount = bookingsByCategory.reduce((sum, b) => sum + b._count.id, 0) || 1;
  const bookingsByCategoryData = bookingsByCategory.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    return {
      name: cat?.name ?? "Unknown",
      nameAr: cat?.nameAr ?? "غير معروف",
      count: b._count.id,
      pct: Math.round((b._count.id / totalCategoryCount) * 100),
    };
  });

  return (
    <AdminDashboardClient
      stats={{
        totalUsers,
        totalProviders,
        activeRequests,
        bookingsToday,
        totalRevenue: revenueResult._sum.totalPrice ?? 0,
        openDisputes,
      }}
      users={JSON.parse(JSON.stringify(users))}
      disputes={JSON.parse(JSON.stringify(disputes))}
      monthlyGrowth={monthlyGrowth}
      bookingsByCategory={bookingsByCategoryData}
      locale={params.locale}
    />
  );
}
