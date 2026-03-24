export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "verify_provider") {
      // Verify provider identity
      await prisma.providerProfile.update({
        where: { userId: params.id },
        data: { identityVerified: true },
      });
      await prisma.user.update({
        where: { id: params.id },
        data: { isVerified: true },
      });
      return NextResponse.json({ success: true, action });
    }

    if (action === "suspend") {
      await prisma.user.update({
        where: { id: params.id },
        data: { isVerified: false },
      });
      // Also suspend provider profile if exists
      await prisma.providerProfile.updateMany({
        where: { userId: params.id },
        data: { isSuspended: true, isActive: false },
      });
      return NextResponse.json({ success: true, action });
    }

    if (action === "unsuspend") {
      await prisma.user.update({
        where: { id: params.id },
        data: { isVerified: true },
      });
      await prisma.providerProfile.updateMany({
        where: { userId: params.id },
        data: { isSuspended: false, isActive: true },
      });
      return NextResponse.json({ success: true, action });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
