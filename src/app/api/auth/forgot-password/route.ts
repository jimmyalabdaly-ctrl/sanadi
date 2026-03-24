export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user — always return generic success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Delete any existing PASSWORD_RESET tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { email: normalizedEmail, type: "PASSWORD_RESET" },
      });

      // Generate new reset token (expires in 1 hour)
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.verificationToken.create({
        data: {
          token,
          email: normalizedEmail,
          type: "PASSWORD_RESET",
          expiresAt,
        },
      });

      // Determine locale from Accept-Language header
      const acceptLanguage = req.headers.get("accept-language") || "";
      const locale = acceptLanguage.toLowerCase().includes("ar") ? "ar" : "en";

      // Send reset email (non-blocking)
      try {
        await sendPasswordResetEmail(normalizedEmail, token, locale);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: "If an account exists with that email, we've sent a reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
