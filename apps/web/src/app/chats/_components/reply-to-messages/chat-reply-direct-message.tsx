import { Button } from "@ui/button";
import { UilMessage, UilMultiply } from "@tooni/iconscout-unicons-react";
import React from "react";
import { usePersistentReplyToMessage } from "../../_hooks";
import { DirectContact } from "@ecency/ns-query";
import { ChatReplyToMessageLayout } from "./chat-reply-to-message-layout";
import i18next from "i18next";

interface Props {
  currentContact?: DirectContact;
}

export function ChatReplyDirectMessage({ currentContact }: Props) {
  const [reply, _, clearReply] = usePersistentReplyToMessage(undefined, currentContact);

  return reply ? (
    <ChatReplyToMessageLayout>
      <div className="flex items-center justify-between w-full gap-4 px-3 py-1">
        <div className="flex items-center gap-4">
          <UilMessage className="text-blue-dark-sky" />
          <div className="flex flex-col border-l-[0.25rem] border-blue-dark-sky pl-2">
            <div className="text-sm text-blue-dark-sky">
              {i18next.t("chat.reply-to", { account: currentContact?.name })}
            </div>
            <div>{reply.content}</div>
          </div>
        </div>
        <Button
          appearance="gray-link"
          size="sm"
          noPadding={true}
          icon={<UilMultiply />}
          onClick={() => clearReply()}
        />
      </div>
    </ChatReplyToMessageLayout>
  ) : (
    <></>
  );
}
