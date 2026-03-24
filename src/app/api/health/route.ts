export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp,
      region: "eu-central-1",
      project: "sanadi",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Health check failed:", message);

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        timestamp,
        error: message,
      },
      { status: 503 }
    );
  }
}
