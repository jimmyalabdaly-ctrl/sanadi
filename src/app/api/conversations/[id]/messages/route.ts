export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            firstNameAr: true,
            lastName: true,
            lastNameAr: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: params.id,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
