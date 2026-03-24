export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        firstNameAr: true,
        lastName: true,
        lastNameAr: true,
        phone: true,
        city: true,
        area: true,
        fullAddress: true,
        bio: true,
        bioAr: true,
        language: true,
        avatar: true,
        role: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        providerProfile: {
          select: {
            id: true,
            businessName: true,
            businessNameAr: true,
            businessDescription: true,
            businessDescriptionAr: true,
            yearsOfExperience: true,
            portfolioImages: true,
            certificates: true,
            availabilitySchedule: true,
            averageRating: true,
            totalReviews: true,
            totalJobsCompleted: true,
            tier: true,
            instantBookEnabled: true,
            isActive: true,
            slug: true,
            services: {
              include: {
                category: {
                  select: { id: true, name: true, nameAr: true, slug: true, icon: true },
                },
              },
            },
            serviceAreas: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const body = await req.json();

    const {
      firstName,
      firstNameAr,
      lastName,
      lastNameAr,
      phone,
      city,
      area,
      fullAddress,
      bio,
      bioAr,
      language,
      avatar,
      // Provider-only fields
      businessName,
      businessNameAr,
      businessDescription,
      businessDescriptionAr,
      yearsOfExperience,
      availabilitySchedule,
      instantBookEnabled,
    } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build user update data — only include defined fields
    const userUpdateData: Record<string, unknown> = {};
    if (firstName !== undefined) userUpdateData.firstName = firstName.trim();
    if (firstNameAr !== undefined) userUpdateData.firstNameAr = firstNameAr.trim();
    if (lastName !== undefined) userUpdateData.lastName = lastName.trim();
    if (lastNameAr !== undefined) userUpdateData.lastNameAr = lastNameAr.trim();
    if (phone !== undefined) userUpdateData.phone = phone ? phone.trim() : null;
    if (city !== undefined) userUpdateData.city = city || null;
    if (area !== undefined) userUpdateData.area = area || null;
    if (fullAddress !== undefined) userUpdateData.fullAddress = fullAddress || null;
    if (bio !== undefined) userUpdateData.bio = bio || null;
    if (bioAr !== undefined) userUpdateData.bioAr = bioAr || null;
    if (language !== undefined) userUpdateData.language = language;
    if (avatar !== undefined) userUpdateData.avatar = avatar || null;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      // Update provider profile if user is a provider
      if (user.role === "PROVIDER" && user.providerProfile) {
        const providerUpdateData: Record<string, unknown> = {};
        if (businessName !== undefined) providerUpdateData.businessName = businessName.trim();
        if (businessNameAr !== undefined) providerUpdateData.businessNameAr = businessNameAr.trim();
        if (businessDescription !== undefined) providerUpdateData.businessDescription = businessDescription;
        if (businessDescriptionAr !== undefined) providerUpdateData.businessDescriptionAr = businessDescriptionAr;
        if (yearsOfExperience !== undefined) providerUpdateData.yearsOfExperience = Number(yearsOfExperience);
        if (availabilitySchedule !== undefined) providerUpdateData.availabilitySchedule = availabilitySchedule;
        if (instantBookEnabled !== undefined) providerUpdateData.instantBookEnabled = Boolean(instantBookEnabled);

        if (Object.keys(providerUpdateData).length > 0) {
          await tx.providerProfile.update({
            where: { id: user.providerProfile.id },
            data: providerUpdateData,
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
