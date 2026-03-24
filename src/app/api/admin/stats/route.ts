export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    ]);

    const totalRevenue = revenueResult._sum.totalPrice ?? 0;

    // User growth: last 12 months grouped by month
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    });

    const monthlyGrowth: Record<string, number> = {};
    recentUsers.forEach((u) => {
      const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthlyGrowth[key] = (monthlyGrowth[key] ?? 0) + 1;
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
    const categories = await prisma.serviceCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, nameAr: true },
    });

    const bookingsByCategoryWithName = bookingsByCategory.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      return {
        name: cat?.name ?? "Unknown",
        nameAr: cat?.nameAr ?? "غير معروف",
        count: b._count.id,
      };
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProviders,
        activeRequests,
        bookingsToday,
        totalRevenue,
        openDisputes,
      },
      monthlyGrowth,
      bookingsByCategory: bookingsByCategoryWithName,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
