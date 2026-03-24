export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.homeProfile.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching home profile:", error);
    return NextResponse.json({ error: "Failed to fetch home profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyType, size, numberOfRooms, numberOfBathrooms, buildingAge, acType, waterHeaterType, features } = body;

    // Upsert so POST is idempotent
    const profile = await prisma.homeProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        propertyType: propertyType ?? null,
        size: size ? parseFloat(size) : null,
        numberOfRooms: numberOfRooms ? parseInt(numberOfRooms) : null,
        buildingAge: buildingAge ? parseInt(buildingAge) : null,
        acType: acType ?? null,
        waterHeaterType: waterHeaterType ?? null,
        features: features ?? null,
      },
      update: {
        propertyType: propertyType ?? null,
        size: size ? parseFloat(size) : null,
        numberOfRooms: numberOfRooms ? parseInt(numberOfRooms) : null,
        buildingAge: buildingAge ? parseInt(buildingAge) : null,
        acType: acType ?? null,
        waterHeaterType: waterHeaterType ?? null,
        features: features ?? null,
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Error creating home profile:", error);
    return NextResponse.json({ error: "Failed to create home profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyType, size, numberOfRooms, numberOfBathrooms, buildingAge, acType, waterHeaterType, features } = body;

    const existing = await prisma.homeProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Home profile not found" }, { status: 404 });
    }

    const updated = await prisma.homeProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(propertyType !== undefined && { propertyType }),
        ...(size !== undefined && { size: size ? parseFloat(size) : null }),
        ...(numberOfRooms !== undefined && { numberOfRooms: numberOfRooms ? parseInt(numberOfRooms) : null }),
        ...(buildingAge !== undefined && { buildingAge: buildingAge ? parseInt(buildingAge) : null }),
        ...(acType !== undefined && { acType }),
        ...(waterHeaterType !== undefined && { waterHeaterType }),
        ...(features !== undefined && { features }),
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Error updating home profile:", error);
    return NextResponse.json({ error: "Failed to update home profile" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.homeProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Home profile not found" }, { status: 404 });
    }

    await prisma.homeProfile.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting home profile:", error);
    return NextResponse.json({ error: "Failed to delete home profile" }, { status: 500 });
  }
}
