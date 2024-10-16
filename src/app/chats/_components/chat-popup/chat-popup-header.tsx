import { Button } from "@ui/button";
import { ChatsDropdownMenu } from "../chats-dropdown-menu";
import React, { useContext, useMemo } from "react";
import { Channel, ChatContext, DirectContact, useKeysQuery } from "@ecency/ns-query";
import { ChatSidebarSavedMessagesAvatar } from "../chats-sidebar/chat-sidebar-saved-messages-avatar";
import { getCommunityCache } from "@/core/caches";
import i18next from "i18next";
import { classNameObject } from "@ui/util";
import { Tooltip } from "@ui/tooltip";
import { addMessageSvg, arrowBackSvg } from "@/assets/img/svg";
import { UserAvatar } from "@/features/shared";

interface Props {
  directContact?: DirectContact;
  channel?: Channel;
  showSearchUser: boolean;
  canSendMessage: boolean;
  handleBackArrowSvg: () => void;
  handleMessageSvgClick: () => void;
}

export function ChatPopupHeader({
  directContact,
  channel,
  showSearchUser,
  canSendMessage,
  handleBackArrowSvg,
  handleMessageSvgClick
}: Props) {
  const { revealPrivateKey, setRevealPrivateKey } = useContext(ChatContext);

  const { data: community } = getCommunityCache(channel?.communityName).useClientQuery();
  const { privateKey } = useKeysQuery();
  const { publicKey } = useKeysQuery();

  const isActiveUser = useMemo(
    () => directContact?.pubkey === publicKey && publicKey,
    [publicKey, directContact]
  );
  const title = useMemo(() => {
    if (revealPrivateKey) {
      return i18next.t("chat.manage-chat-key");
    }

    if (isActiveUser) {
      return i18next.t("chat.saved-messages");
    }

    if (directContact) {
      return directContact.name;
    }

    if (community) {
      return community.title;
    }

    if (showSearchUser) {
      return i18next.t("chat.new-message");
    }

    return "";
  }, [directContact, community, showSearchUser, revealPrivateKey, isActiveUser]);
  const isExpanded = useMemo(
    () => directContact || community || showSearchUser || revealPrivateKey,
    [directContact, community, showSearchUser, revealPrivateKey]
  );

  return (
    <div
      className={classNameObject({
        "flex items-center justify-between px-2 py-2 gap-2 cursor-pointer": true,
        "border-b border-[--border-color]": !!directContact || !!channel
      })}
    >
      <div className="flex items-center">
        {isExpanded && (
          <Tooltip content={i18next.t("chat.back")}>
            <Button
              size="sm"
              appearance="link"
              onClick={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                handleBackArrowSvg();
              }}
              icon={arrowBackSvg}
            />
          </Tooltip>
        )}
        <div className="flex items-center">
          {(directContact || channel) &&
            (isActiveUser ? (
              <ChatSidebarSavedMessagesAvatar width={24} height={24} />
            ) : (
              <UserAvatar username={community?.name ?? directContact?.name ?? ""} size="small" />
            ))}

          <div
            className={classNameObject({
              "truncate max-w-[180px] font-semibold pl-4": true
            })}
          >
            {title}
          </div>
        </div>
      </div>
      <div
        className={classNameObject({
          "flex items-center": true,
          "absolute right-2 bg-gray-100 dark:bg-gray-900 rounded-full pl-3 pr-1 py-1 bottom-2 z-10 gap-2":
            !isExpanded,
          "gap-4": !!isExpanded
        })}
      >
        {canSendMessage && (
          <Tooltip content={i18next.t("chat.new-message")}>
            <Button
              noPadding={true}
              size="sm"
              appearance="gray-link"
              icon={addMessageSvg}
              onClick={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                handleMessageSvgClick();
              }}
            />
          </Tooltip>
        )}
        {privateKey && (
          <div className="flex items-center">
            <ChatsDropdownMenu
              isWidget={true}
              channel={channel}
              contact={directContact}
              onManageChatKey={() => setRevealPrivateKey(!revealPrivateKey)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
