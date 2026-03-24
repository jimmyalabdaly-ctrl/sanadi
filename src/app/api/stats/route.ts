export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export async function GET() {
  try {
    const [userCount, providerCount, completedBookings, cityResult] =
      await Promise.all([
        prisma.user.count(),
        prisma.providerProfile.count({ where: { isActive: true, isSuspended: false } }),
        prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
        prisma.providerServiceArea.findMany({
          select: { city: true },
          distinct: ["city"],
        }),
      ]);

    return NextResponse.json({
      users: userCount,
      providers: providerCount,
      completedBookings,
      cities: cityResult.length,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { users: 0, providers: 0, completedBookings: 0, cities: 0 },
      { status: 200 }
    );
  }
}
