export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Verify user is a PROVIDER
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true },
    });

    if (!user || user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Forbidden: not a provider" }, { status: 403 });
    }

    if (!user.providerProfile) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    const body = await request.json();

    const {
      // Personal info
      firstName,
      firstNameAr,
      lastName,
      lastNameAr,
      phone,
      // Business details
      businessName,
      businessNameAr,
      businessDescription,
      businessDescriptionAr,
      yearsOfExperience,
      // Services: [{ categoryId, priceMin, priceMax }]
      services,
      // Service areas: [{ city, area? }]
      serviceAreas,
      // Portfolio images (already uploaded URLs)
      portfolioImages,
      // Verification doc URLs
      certificates,
      // Availability: { saturday: { enabled, startTime, endTime }, ... }
      availabilitySchedule,
    } = body;

    const providerId = user.providerProfile.id;

    await prisma.$transaction(async (tx) => {
      // Update user personal info
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(firstName !== undefined && { firstName: firstName.trim() }),
          ...(firstNameAr !== undefined && { firstNameAr: firstNameAr.trim() }),
          ...(lastName !== undefined && { lastName: lastName.trim() }),
          ...(lastNameAr !== undefined && { lastNameAr: lastNameAr.trim() }),
          ...(phone !== undefined && { phone: phone.trim() || null }),
        },
      });

      // Update provider profile
      await tx.providerProfile.update({
        where: { id: providerId },
        data: {
          ...(businessName !== undefined && { businessName: businessName.trim() }),
          ...(businessNameAr !== undefined && { businessNameAr: businessNameAr.trim() }),
          ...(businessDescription !== undefined && { businessDescription }),
          ...(businessDescriptionAr !== undefined && { businessDescriptionAr }),
          ...(yearsOfExperience !== undefined && { yearsOfExperience: Number(yearsOfExperience) }),
          ...(portfolioImages !== undefined && { portfolioImages }),
          ...(certificates !== undefined && { certificates }),
          ...(availabilitySchedule !== undefined && { availabilitySchedule }),
        },
      });

      // Update services: delete existing, re-create
      if (services !== undefined && Array.isArray(services)) {
        await tx.providerService.deleteMany({ where: { providerId } });
        if (services.length > 0) {
          await tx.providerService.createMany({
            data: services.map((s: { categoryId: string; priceMin?: number; priceMax?: number }) => ({
              providerId,
              categoryId: s.categoryId,
              priceMin: s.priceMin ?? null,
              priceMax: s.priceMax ?? null,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Update service areas: delete existing, re-create
      if (serviceAreas !== undefined && Array.isArray(serviceAreas)) {
        await tx.providerServiceArea.deleteMany({ where: { providerId } });
        if (serviceAreas.length > 0) {
          await tx.providerServiceArea.createMany({
            data: serviceAreas.map((a: { city: string; area?: string }) => ({
              providerId,
              city: a.city,
              area: a.area || null,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Provider onboarding error:", error);
    return NextResponse.json({ error: "Failed to update provider profile" }, { status: 500 });
  }
}
