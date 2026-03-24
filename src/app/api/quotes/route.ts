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
    const serviceRequestId = searchParams.get("serviceRequestId");

    const where: Record<string, unknown> = {};
    if (session.user.role === "PROVIDER") {
      where.providerId = session.user.id;
    }
    if (serviceRequestId) where.serviceRequestId = serviceRequestId;

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        provider: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, avatar: true, providerProfile: true } },
        serviceRequest: { include: { category: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceRequestId, priceQuote, estimatedDuration, message, messageAr, availableDate, includesItems } = body;

    const quote = await prisma.quote.create({
      data: {
        providerId: session.user.id,
        serviceRequestId,
        priceQuote,
        estimatedDuration,
        message,
        messageAr,
        availableDate: availableDate ? new Date(availableDate) : null,
        includesItems,
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { status: "QUOTED" },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
