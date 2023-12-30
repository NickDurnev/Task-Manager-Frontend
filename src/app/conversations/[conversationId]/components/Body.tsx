"use client";

import { FC, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { find } from "lodash";
import { AnimatePresence } from "framer-motion";
import axios from "axios";

import { FullMessageType } from "@/app/types";
import MessageBox from "./MessageBox";
import scrollTo from "@/helpers/scrollTo";
//# HOOKS
import useConversation from "@/app/hooks/useConversation";
import usePusherClient from "@/app/hooks/usePusherClient";
import useTheme from "@/app/hooks/useTheme";
import useAxiosAuth from "@/app/libs/hooks/useAxiosAuth";
interface BodyProps {
  initialMessages: FullMessageType[];
  isGroup: boolean | null;
}

const Body: FC<BodyProps> = ({ initialMessages, isGroup }) => {
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { conversationId } = useConversation();
  const { data: session } = useSession();
  const axiosAuth = useAxiosAuth();
  const { theme } = useTheme();
  const { pusherClient } = usePusherClient();

  const currentDate = new Date();
  const currentUserEmail = session?.user?.email;

  useEffect(() => {
    axiosAuth.post(`conversations/${conversationId}/seen`);
  }, [axiosAuth, conversationId]);

  useEffect(() => {
    pusherClient?.subscribe(conversationId);
    scrollTo(bottomRef);
    const messageHandler = (message: FullMessageType) => {
      if (currentUserEmail !== message.sender.email) {
        axiosAuth.post(`conversations/${conversationId}/seen`);
      }

      setMessages((current) => {
        if (find(current, { id: message.id })) {
          return current;
        }

        return [...current, message];
      });

      scrollTo(bottomRef);
    };

    const updateMessageHandler = (newMessage: FullMessageType) => {
      setMessages((current) =>
        current.map((currentMessage) => {
          if (currentMessage.id === newMessage.id) {
            return newMessage;
          }

          return currentMessage;
        })
      );

      scrollTo(bottomRef);
    };

    const deleteMessageHandler = (deletedMessage: FullMessageType) => {
      setMessages((current) =>
        [...current].filter(({ id }) => id !== deletedMessage.id)
      );
    };

    pusherClient?.bind("messages:new", messageHandler);
    pusherClient?.bind("message:update", updateMessageHandler);
    pusherClient?.bind("message:delete", deleteMessageHandler);
    return () => {
      pusherClient?.unsubscribe(conversationId);
      pusherClient?.unbind("messages:new", messageHandler);
      pusherClient?.unbind("message:update", updateMessageHandler);
      pusherClient?.unbind("message:delete", deleteMessageHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return (
    <AnimatePresence>
      <div className="flex-1 overflow-y-auto bg-skin-main">
        {messages.map((message) => (
          <MessageBox
            key={message.id}
            data={message}
            currentDate={currentDate}
            currentUserEmail={currentUserEmail}
            isGroup={isGroup}
            isLast={message.id === messages[messages.length - 1].id}
            theme={theme}
          />
        ))}
        <div ref={bottomRef} className="pt-4" />
      </div>
    </AnimatePresence>
  );
};

export default Body;
