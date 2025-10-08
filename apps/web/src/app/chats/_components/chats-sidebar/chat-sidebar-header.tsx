import { ChatsDropdownMenu } from "../chats-dropdown-menu";
import React, { useContext } from "react";
import { ChatContext, useKeysQuery } from "@ecency/ns-query";
import i18next from "i18next";

export function ChatSidebarHeader() {
  const { privateKey } = useKeysQuery();
  const { revealPrivateKey, setRevealPrivateKey } = useContext(ChatContext);

  return (
    <div className="sticky top-0 z-10 bg-white flex items-center justify-between border-b border-[--border-color] pl-4 pr-2 py-3 gap-4">
      <div className="flex items-center gap-2">
        <div className="font-semibold text-gray-600 text-sm">{i18next.t("chat.title")}</div>
      </div>
      <div className="flex items-center">
        {!!privateKey && (
          <div className="chat-menu">
            <ChatsDropdownMenu onManageChatKey={() => setRevealPrivateKey(!revealPrivateKey)} />
          </div>
        )}
      </div>
    </div>
  );
}
