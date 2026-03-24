export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "recommended";
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const verifiedOnly = searchParams.get("verified") === "true";
    const instantOnly = searchParams.get("instant") === "true";

    const where: Record<string, unknown> = {
      isActive: true,
      isSuspended: false,
    };

    if (category) {
      where.services = { some: { category: { slug: category } } };
    }

    if (city) {
      where.serviceAreas = { some: { city } };
    }

    if (minRating > 0) {
      where.averageRating = { gte: minRating };
    }

    if (verifiedOnly) {
      where.identityVerified = true;
    }

    if (instantOnly) {
      where.instantBookEnabled = true;
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case "rating":
        orderBy.averageRating = "desc";
        break;
      case "response":
        orderBy.responseTime = "asc";
        break;
      // price-low and price-high are handled client-side since prices are per service
      default:
        orderBy.averageRating = "desc";
        break;
    }

    const [providers, total] = await Promise.all([
      prisma.providerProfile.findMany({
        where,
        include: {
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
          services: { include: { category: true } },
          serviceAreas: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.providerProfile.count({ where }),
    ]);

    return NextResponse.json({ providers, total, page, limit });
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}
