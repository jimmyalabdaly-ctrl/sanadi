export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serviceRequestSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    // Scope to the requesting user if they are a customer
    if (session.user.role === "CUSTOMER") {
      where.customerId = session.user.id;
    } else if (customerId) {
      where.customerId = customerId;
    }

    if (status) where.status = status;
    if (category) where.category = { slug: category };

    const [serviceRequests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              firstNameAr: true,
              lastName: true,
              lastNameAr: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              slug: true,
              icon: true,
            },
          },
          quotes: { select: { id: true, status: true } },
          _count: { select: { quotes: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return NextResponse.json({ serviceRequests, total, page, limit });
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch service requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Only customers can create service requests" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const parsed = serviceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const {
      categoryId,
      title,
      titleAr,
      description,
      descriptionAr,
      budgetMin,
      budgetMax,
      urgency,
      preferredDate,
      preferredTime,
      city,
      area,
      address,
      isGroupRequest,
      groupSize,
    } = parsed.data;

    const images: string[] = Array.isArray(body.images) ? body.images : [];

    // Expire in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        customerId: session.user.id,
        categoryId,
        title,
        titleAr,
        description,
        descriptionAr,
        images,
        budgetMin,
        budgetMax,
        urgency,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime,
        city,
        area,
        address,
        isGroupRequest: isGroupRequest ?? false,
        groupSize: isGroupRequest ? groupSize : null,
        status: "OPEN",
        expiresAt,
      },
      include: {
        category: {
          select: { id: true, name: true, nameAr: true, slug: true },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            firstNameAr: true,
            lastName: true,
            lastNameAr: true,
          },
        },
      },
    });

    return NextResponse.json({ serviceRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating service request:", error);
    return NextResponse.json(
      { error: "Failed to create service request" },
      { status: 500 }
    );
  }
}
