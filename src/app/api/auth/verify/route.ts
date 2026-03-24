import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/en/login?error=missing_token", req.url)
    );
  }

  try {
    // Find the verification token record
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.redirect(
        new URL("/en/login?error=invalid_token", req.url)
      );
    }

    if (record.expiresAt < new Date()) {
      // Token expired — delete it and redirect with error
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(
        new URL("/en/login?error=token_expired", req.url)
      );
    }

    if (record.type !== "EMAIL_VERIFICATION") {
      return NextResponse.redirect(
        new URL("/en/login?error=invalid_token", req.url)
      );
    }

    // Mark user as email-verified and delete the token (both in one transaction)
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { email: record.email },
        data: { isEmailVerified: true, isVerified: true },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    // Redirect to login with success flag
    return NextResponse.redirect(
      new URL("/en/login?verified=1", req.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/en/login?error=server_error", req.url)
    );
  }
}
