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

    const disputes = await prisma.report.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      include: {
        reporter: {
          select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true },
        },
        reported: {
          select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true },
        },
        booking: { select: { id: true, totalPrice: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("Error fetching disputes:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}
