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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { isActive } = body;

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile || profile.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.providerProfile.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
