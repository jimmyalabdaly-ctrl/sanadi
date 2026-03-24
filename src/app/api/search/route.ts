export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const city = searchParams.get("city");

    if (!query) {
      return NextResponse.json({ providers: [], categories: [] });
    }

    const [providers, categories] = await Promise.all([
      prisma.providerProfile.findMany({
        where: {
          isActive: true,
          isSuspended: false,
          OR: [
            { businessName: { contains: query, mode: "insensitive" } },
            { businessNameAr: { contains: query, mode: "insensitive" } },
            { user: { firstName: { contains: query, mode: "insensitive" } } },
            { user: { firstNameAr: { contains: query, mode: "insensitive" } } },
          ],
          ...(city ? { serviceAreas: { some: { city } } } : {}),
        },
        include: {
          user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, avatar: true, city: true } },
          services: { include: { category: true } },
        },
        take: 20,
      }),
      prisma.serviceCategory.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { nameAr: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({ providers, categories });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
