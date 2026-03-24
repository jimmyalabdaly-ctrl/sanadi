export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true, parentCategoryId: null },
      include: {
        subCategories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        _count: { select: { providerServices: true, serviceRequests: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
