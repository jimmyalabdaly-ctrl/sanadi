export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const roleFilter = searchParams.get("role") ?? "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (roleFilter && roleFilter !== "all") {
      where.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where,
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
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
