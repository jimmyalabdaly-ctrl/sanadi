export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude ambiguous chars I, O, 0, 1
  let result = "SANADI-";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if already has a code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (user?.referralCode) {
      return NextResponse.json({ referralCode: user.referralCode });
    }

    // Generate a unique code (retry up to 10 times on collision)
    let code = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateCode();
      const existing = await prisma.user.findUnique({
        where: { referralCode: candidate },
        select: { id: true },
      });
      if (!existing) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
      select: { referralCode: true },
    });

    return NextResponse.json({ referralCode: updated.referralCode });
  } catch (error) {
    console.error("Error generating referral code:", error);
    return NextResponse.json({ error: "Failed to generate referral code" }, { status: 500 });
  }
}
