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

    const body = await request.json();
    const { status, cancellationReason } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const userRole = session.user.role;

    // Validate ownership
    if (
      userRole === "CUSTOMER" &&
      booking.customerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      userRole === "PROVIDER" &&
      booking.providerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cancelStatus =
      userRole === "CUSTOMER"
        ? "CANCELLED_BY_CUSTOMER"
        : "CANCELLED_BY_PROVIDER";

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: status || cancelStatus,
        cancellationReason: cancellationReason ?? null,
      },
    });

    // Reopen the service request if cancelled
    if (updated.status.startsWith("CANCELLED")) {
      await prisma.serviceRequest.update({
        where: { id: booking.serviceRequestId },
        data: { status: "OPEN" },
      });
    }

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
