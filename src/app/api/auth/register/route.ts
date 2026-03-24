import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      firstName,
      firstNameAr,
      lastName,
      lastNameAr,
      phone,
      city,
      area,
      role,
      referralCode,
    } = body;

    // Basic validation
    if (
      !email ||
      !password ||
      !firstName ||
      !firstNameAr ||
      !lastName ||
      !lastNameAr
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["CUSTOMER", "PROVIDER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be CUSTOMER or PROVIDER" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check for existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Check for existing phone if provided
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: phone.trim() },
      });
      if (existingPhone) {
        return NextResponse.json(
          { error: "An account with this phone number already exists" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token (valid for 24 hours)
    const verificationToken = randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Look up referrer if referralCode provided
    let referrerId: string | null = null;
    if (referralCode && typeof referralCode === "string") {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim().toUpperCase() },
        select: { id: true },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Create user, wallet, optional provider profile, and verification token in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          firstName: firstName.trim(),
          firstNameAr: firstNameAr.trim(),
          lastName: lastName.trim(),
          lastNameAr: lastNameAr.trim(),
          phone: phone ? phone.trim() : null,
          city: city || null,
          area: area || null,
          role: role as "CUSTOMER" | "PROVIDER",
          language: "ar",
        },
      });

      // Create wallet with 0 balance
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
        },
      });

      // If provider, create a stub provider profile
      if (role === "PROVIDER") {
        const slug = `${firstName.toLowerCase().replace(/\s+/g, "-")}-${lastName.toLowerCase().replace(/\s+/g, "-")}-${newUser.id.slice(-6)}`;
        await tx.providerProfile.create({
          data: {
            userId: newUser.id,
            businessName: `${firstName} ${lastName}`,
            businessNameAr: `${firstNameAr} ${lastNameAr}`,
            slug,
          },
        });
      }

      // Store verification token
      await tx.verificationToken.create({
        data: {
          token: verificationToken,
          email: newUser.email,
          type: "EMAIL_VERIFICATION",
          expiresAt: tokenExpiry,
        },
      });

      // Create referral record if referred
      if (referrerId) {
        // Upsert: update existing email-only record or create new
        const existingReferral = await tx.referral.findFirst({
          where: {
            referrerId,
            referredEmail: newUser.email,
            referredUserId: null,
          },
        });
        if (existingReferral) {
          await tx.referral.update({
            where: { id: existingReferral.id },
            data: { referredUserId: newUser.id, status: "PENDING" },
          });
        } else {
          await tx.referral.create({
            data: {
              referrerId,
              referredEmail: newUser.email,
              referredUserId: newUser.id,
              status: "PENDING",
            },
          });
        }
      }

      return newUser;
    });

    // Determine locale for email (accept-language header or default to "en")
    const acceptLanguage = req.headers.get("accept-language") || "";
    const locale = acceptLanguage.includes("ar") ? "ar" : "en";

    // Send verification email (non-blocking — don't fail registration if email fails)
    try {
      await sendVerificationEmail(user.email, verificationToken, locale);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue — user is created, email can be resent later
    }

    // Return user without passwordHash
    const { passwordHash: _omit, ...safeUser } = user;

    return NextResponse.json(
      {
        user: safeUser,
        message:
          "Account created successfully. Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
