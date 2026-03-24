export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Look up the token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    if (verificationToken.type !== "PASSWORD_RESET") {
      return NextResponse.json({ error: "Invalid token type" }, { status: 400 });
    }

    if (verificationToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Reset token has expired. Please request a new one." }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and delete token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
