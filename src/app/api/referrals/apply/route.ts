export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { referralCode } = body;

    if (!referralCode || typeof referralCode !== "string") {
      return NextResponse.json({ error: "referralCode is required" }, { status: 400 });
    }

    const newUserId = session.user.id;

    // Find the referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.trim().toUpperCase() },
      select: { id: true },
    });

    if (!referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    if (referrer.id === newUserId) {
      return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
    }

    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      select: { email: true },
    });

    if (!newUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if a referral already exists for this pair
    const existing = await prisma.referral.findFirst({
      where: {
        referrerId: referrer.id,
        referredUserId: newUserId,
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Referral already applied" });
    }

    // Upsert: update existing pending email record or create new one
    const existingByEmail = await prisma.referral.findFirst({
      where: {
        referrerId: referrer.id,
        referredEmail: newUser.email,
        referredUserId: null,
      },
    });

    let referral;
    if (existingByEmail) {
      referral = await prisma.referral.update({
        where: { id: existingByEmail.id },
        data: { referredUserId: newUserId, status: "PENDING" },
      });
    } else {
      referral = await prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredEmail: newUser.email,
          referredUserId: newUserId,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ referral, message: "Referral applied successfully" });
  } catch (error) {
    console.error("Error applying referral:", error);
    return NextResponse.json({ error: "Failed to apply referral" }, { status: 500 });
  }
}
