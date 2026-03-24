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
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ messages });
    }

    // Get conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: session.user.id } },
        isActive: true,
      },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, avatar: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content, attachments, receiverId } = body;

    let convId = conversationId;

    // Create conversation if it doesn't exist
    if (!convId && receiverId) {
      const conv = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: session.user.id },
              { userId: receiverId },
            ],
          },
        },
      });
      convId = conv.id;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: session.user.id,
        receiverId,
        content,
        attachments: attachments || [],
      },
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
