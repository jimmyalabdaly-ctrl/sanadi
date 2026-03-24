export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendReferralEmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
    });

    const total = referrals.length;
    const pending = referrals.filter((r) => r.status === "PENDING").length;
    const completed = referrals.filter((r) => r.status === "COMPLETED").length;
    const totalEarned = referrals
      .filter((r) => r.status === "COMPLETED" && r.rewardCredited)
      .reduce((sum, r) => sum + r.rewardAmount, 0);

    return NextResponse.json({
      referralCode: user?.referralCode ?? null,
      stats: { total, pending, completed, totalEarned },
      referrals,
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Get referrer's info including their code
    const referrer = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        firstName: true,
        firstNameAr: true,
        lastName: true,
      },
    });

    if (!referrer?.referralCode) {
      return NextResponse.json(
        { error: "You need a referral code first. Generate one in your dashboard." },
        { status: 400 }
      );
    }

    // Prevent duplicate pending referrals to the same email
    const existing = await prisma.referral.findFirst({
      where: { referrerId: userId, referredEmail: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already sent a referral to this email" },
        { status: 409 }
      );
    }

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: userId,
        referredEmail: email.toLowerCase().trim(),
        status: "PENDING",
      },
    });

    // Send referral email (non-blocking)
    const referrerName = `${referrer.firstName} ${referrer.lastName}`;
    const acceptLanguage = req.headers.get("accept-language") || "";
    const locale = acceptLanguage.includes("ar") ? "ar" : "en";

    try {
      await sendReferralEmail(referrerName, email, referrer.referralCode, locale);
    } catch (emailErr) {
      console.error("Referral email failed:", emailErr);
    }

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
