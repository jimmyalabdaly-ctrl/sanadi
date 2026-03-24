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
    const { status, adminNotes, resolution } = body;

    const validStatuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.report.update({
      where: { id: params.id },
      data: {
        status,
        adminNotes: adminNotes ?? undefined,
        resolution: resolution ?? undefined,
      },
    });

    return NextResponse.json({ dispute: updated });
  } catch (error) {
    console.error("Error updating dispute:", error);
    return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 });
  }
}
