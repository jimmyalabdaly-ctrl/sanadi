export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (session.user.role === "CUSTOMER") {
      where.customerId = session.user.id;
    } else if (session.user.role === "PROVIDER") {
      where.providerId = session.user.id;
    }

    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, avatar: true } },
        provider: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, avatar: true, providerProfile: true } },
        serviceRequest: { include: { category: true } },
        quote: true,
        review: true,
      },
      orderBy: { scheduledDate: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quoteId, serviceRequestId, providerId, scheduledDate, scheduledTime, totalPrice, paymentMethod } = body;

    const platformFee = totalPrice * 0.1;
    const providerEarnings = totalPrice - platformFee;

    const booking = await prisma.booking.create({
      data: {
        customerId: session.user.id,
        providerId,
        serviceRequestId,
        quoteId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        totalPrice,
        platformFee,
        providerEarnings,
        paymentMethod: paymentMethod || "CASH",
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { status: "BOOKED" },
    });

    // Update quote status
    if (quoteId) {
      await prisma.quote.update({
        where: { id: quoteId },
        data: { status: "ACCEPTED" },
      });
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
