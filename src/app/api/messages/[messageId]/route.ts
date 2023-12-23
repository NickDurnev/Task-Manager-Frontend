import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import getCurrentUser from "@/app/actions/getCurrentUser";
import getMessages from "@/app/actions/getMessages";
import { errors } from "@/helpers/responseVariants";
import { User } from "@prisma/client";

interface IParams {
  messageId?: string;
}

interface IArguments {
  id: string;
  lastMessageAt: Date;
  users: User[];
  messageId?: string;
  currentUserId?: string;
}

async function handler(request: Request, { params }: { params: IParams }) {
  try {
    const { messageId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse(
        errors.UNAUTHORIZED.message,
        errors.UNAUTHORIZED.status
      );
    }

    const existingMessage = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!existingMessage) {
      return new NextResponse(
        errors.INVALID_ID.message,
        errors.INVALID_ID.status
      );
    }

    const existingConversation = await prisma.conversation.findUnique({
      where: {
        id: existingMessage.conversationId!,
      },
      include: {
        users: true,
      },
    });

    if (!existingConversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    const { id, lastMessageAt, users } = existingConversation;

    if (request.method === "DELETE") {
      return await DELETE(request, { id, lastMessageAt, users, messageId });
    }

    if (request.method === "PATCH") {
      return await PATCH(request, {
        id,
        lastMessageAt,
        users,
        messageId,
        currentUserId: currentUser.id,
      });
    }
  } catch (error) {
    console.log(error, "ERROR_MESSAGE_DELETE");
    return new NextResponse(
      errors.INTERNAL_ERROR.message,
      errors.INTERNAL_ERROR.status
    );
  }
}

async function DELETE(
  request: Request,
  { id, lastMessageAt, users, messageId }: IArguments
) {
  const deletedMessage = await prisma.message.delete({
    where: {
      id: messageId,
    },
  });

  await pusherServer.trigger(id, "message:delete", deletedMessage);

  const date1 = new Date(lastMessageAt);
  const date2 = new Date(deletedMessage.createdAt);
  const time1 = date1.getHours() + date1.getMinutes() + date1.getSeconds();
  const time2 = date2.getHours() + date2.getMinutes() + date2.getSeconds();

  const isLastMessage = Math.abs(time1 - time2) <= 1;

  const messages = await getMessages(id);

  if (isLastMessage && messages.length > 1) {
    const lastMessage = messages[messages.length - 1];
    await prisma.conversation.update({
      where: {
        id,
      },
      data: {
        lastMessageAt: lastMessage.createdAt,
      },
    });
    users.forEach((user) => {
      if (user.email) {
        pusherServer.trigger(user.email, "conversation:deleteMessage", {
          id,
          messages: [lastMessage],
        });
      }
    });
  }

  return NextResponse.json(deletedMessage);
}

async function PATCH(
  request: Request,
  { id, messageId, currentUserId }: IArguments
) {
  const body = await request.json();
  const { message, image } = body;

  const updatedMessage = await prisma.message.update({
    where: {
      id: messageId,
    },
    include: {
      sender: true,
      seen: true,
    },
    data: {
      body: message,
      image: image,
      editedAt: new Date().toISOString(),
      seen: {
        connect: {
          id: currentUserId,
        },
      },
    },
  });

  await pusherServer.trigger(id, "message:update", updatedMessage);

  return NextResponse.json(updatedMessage);
}

export { handler as PATCH, handler as DELETE };
