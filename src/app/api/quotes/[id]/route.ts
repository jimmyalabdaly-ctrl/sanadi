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
    const { status } = body;

    const validStatuses = ["ACCEPTED", "DECLINED", "WITHDRAWN"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { serviceRequest: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Customers can accept/decline; providers can withdraw
    const userRole = session.user.role;
    if (
      (status === "ACCEPTED" || status === "DECLINED") &&
      userRole !== "CUSTOMER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status === "WITHDRAWN" && userRole !== "PROVIDER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.quote.update({
      where: { id: params.id },
      data: { status },
    });

    // If accepted, mark service request as BOOKED
    if (status === "ACCEPTED") {
      await prisma.serviceRequest.update({
        where: { id: quote.serviceRequestId },
        data: { status: "BOOKED" },
      });
      // Decline all other quotes for same request
      await prisma.quote.updateMany({
        where: {
          serviceRequestId: quote.serviceRequestId,
          id: { not: params.id },
          status: "PENDING",
        },
        data: { status: "DECLINED" },
      });
    }

    return NextResponse.json({ quote: updated });
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
