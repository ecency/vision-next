import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./index.scss";
import { ChatMessageItem } from "../chat-message-item";
import {
  checkContiguousMessage,
  DirectContact,
  DirectMessage,
  Message,
  useDirectMessagesQuery,
  useKeysQuery
} from "@ecency/ns-query";
import { ChatFloatingDate } from "../chat-floating-date";
import dayjs from "@/utils/dayjs";
import { groupMessages } from "../../_utils";
import useDebounce from "react-use/lib/useDebounce";
import { Dropdown, DropdownItemWithIcon, DropdownMenu } from "@ui/dropdown";
import { UilCommentAltMessage, UilMessage } from "@tooni/iconscout-unicons-react";
import { ForwardMessageDialog } from "../forward-message-dialog";
import { usePersistentReplyToMessage } from "../../_hooks";
import i18next from "i18next";

interface Props {
  directMessages: DirectMessage[];
  currentContact: DirectContact;
  isPage?: boolean;
}

export function ChatsDirectMessages(props: Props) {
  const { directMessages } = props;

  const [needFetchNextPage, setNeedFetchNextPage] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message>();

  const { publicKey } = useKeysQuery();
  const directMessagesQuery = useDirectMessagesQuery(props.currentContact);
  const [_, setReply] = usePersistentReplyToMessage(undefined, props.currentContact);

  // Message where users interacted with context menu
  const [currentInteractingMessageId, setCurrentInteractingMessageId] = useState<string>();

  const groupedDirectMessages = useMemo(() => groupMessages(directMessages), [directMessages]);

  useDebounce(
    () => {
      if (needFetchNextPage) {
        directMessagesQuery.fetchNextPage();
      }
    },
    500,
    [needFetchNextPage]
  );

  useEffect(() => {
    if (directMessages.length === 0) {
      directMessagesQuery.refetch();
    }
  }, [directMessages, directMessagesQuery]);

  const getDifferenceInCalendarDays = useCallback(
    (i: number, date: Date) =>
      i > 0
        ? dayjs(date)
            .startOf("day")
            .diff(dayjs(groupedDirectMessages[i - 1][0]).startOf("day"), "day")
        : 1,
    [groupedDirectMessages]
  );

  return (
    <div className="direct-messages">
      {groupedDirectMessages?.map(([date, messages], i) => (
        <div className="relative" key={date.getTime()}>
          {getDifferenceInCalendarDays(i, date) > 0 && (
            <ChatFloatingDate currentDate={date} isPage={props.isPage} />
          )}
          {messages.map((message, j) => (
            <Dropdown
              key={message.id}
              closeOnClickOutside={true}
              show={currentInteractingMessageId === message.id}
              setShow={(v) =>
                setCurrentInteractingMessageId(v ? currentInteractingMessageId : undefined)
              }
            >
              <ChatMessageItem
                showDate={j === messages.length - 1}
                key={message.id}
                currentContact={props.currentContact}
                type={message.creator !== publicKey ? "receiver" : "sender"}
                message={message}
                isSameUser={checkContiguousMessage(message, i, messages as DirectMessage[])}
                onContextMenu={() => setCurrentInteractingMessageId(message.id)}
                onAppear={() =>
                  setTimeout(
                    () =>
                      groupedDirectMessages?.length - 1 === i && messages.length - 1 === j
                        ? document
                            .querySelector(`[data-message-id="${message.id}"]`)
                            ?.scrollIntoView({ block: "nearest" })
                        : {},
                    300
                  )
                }
                onInViewport={(inViewport) =>
                  i === 0 && j === 0 && setNeedFetchNextPage(inViewport)
                }
              />
              <DropdownMenu
                size="small"
                className="top-[70%]"
                align={message.creator === publicKey ? "right" : "left"}
              >
                <DropdownItemWithIcon
                  icon={<UilMessage />}
                  label={i18next.t("chat.forward")}
                  onClick={() => setForwardingMessage(message)}
                />
                <DropdownItemWithIcon
                  icon={<UilCommentAltMessage />}
                  label={i18next.t("chat.reply")}
                  onClick={() => setReply(message)}
                />
              </DropdownMenu>
            </Dropdown>
          ))}
        </div>
      ))}
      {forwardingMessage && (
        <ForwardMessageDialog
          message={forwardingMessage!!}
          show={!!forwardingMessage}
          setShow={() => setForwardingMessage(undefined)}
        />
      )}
    </div>
  );
}
