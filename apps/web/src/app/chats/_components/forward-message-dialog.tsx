import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { List } from "@ui/list";
import { ChatSidebarDirectContact } from "./chats-sidebar/chat-sidebar-direct-contact";
import { ChatSidebarChannel } from "./chats-sidebar/chat-sidebar-channel";
import React, { useEffect, useState } from "react";
import {
  Channel,
  DirectContact,
  Message,
  useChannelsQuery,
  useDirectContactsQuery,
  useSendMessage
} from "@ecency/ns-query";
import { Spinner } from "@ui/spinner";
import { error, success } from "@/features/shared";
import i18next from "i18next";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
  message: Message;
}

export function ForwardMessageDialog({ show, setShow, message }: Props) {
  const { data: contacts } = useDirectContactsQuery();
  const { data: channels } = useChannelsQuery();

  const [selectedChannel, setSelectedChannel] = useState<Channel>();
  const [selectedContact, setSelectedContact] = useState<DirectContact>();

  const {
    mutateAsync: forwardMessage,
    isPending: isMessageForwarding,
    isSuccess: isMessageForwardSuccess,
    isError: isMessageForwardError
  } = useSendMessage(selectedChannel, selectedContact);

  useEffect(() => {
    if (isMessageForwardError) {
      error(i18next.t("g.error"));
      setShow(false);
    }
  }, [isMessageForwardError, setShow]);

  useEffect(() => {
    if (isMessageForwardSuccess) {
      success(i18next.t("g.success"));
      setShow(false);
    }
  }, [isMessageForwardSuccess, setShow]);

  useEffect(() => {
    if (selectedContact) {
      setTimeout(
        () => forwardMessage({ message: message.content, forwardedFrom: message.creator }),
        1
      );
    }
  }, [forwardMessage, message.content, message.creator, selectedContact]);

  useEffect(() => {
    if (selectedChannel) {
      setTimeout(
        () => forwardMessage({ message: message.content, forwardedFrom: message.creator }),
        1
      );
    }
  }, [forwardMessage, message.content, message.creator, selectedChannel]);

  return (
    <Modal centered={true} show={show} onHide={() => setShow(false)}>
      <ModalHeader closeButton={true}>
        <div>{i18next.t("chat.message-forwarding")}</div>
      </ModalHeader>
      <ModalBody>
        <div className="relative">
          <div className="mb-4 text-blue-dark-sky">
            {i18next.t("chat.select-contact-or-channel")}
          </div>
          {(contacts?.length ?? 0) > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold text-gray-500 uppercase px-3">
                {i18next.t("chat.direct-messages")}
              </div>
              <List>
                {contacts?.map((contact) => (
                  <div
                    className="border-b border-[--border-color] cursor-pointer"
                    key={contact.pubkey}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <ChatSidebarDirectContact contact={contact} />
                  </div>
                ))}
              </List>
            </div>
          )}
          {channels.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold text-gray-500 uppercase px-3">
                {i18next.t("chat.communities")}
              </div>
              <List>
                {channels.map((channel) => (
                  <div
                    className="border-b border-[--border-color] cursor-pointer"
                    key={channel.id}
                    onClick={() => setSelectedChannel(selectedChannel)}
                  >
                    <ChatSidebarChannel
                      username={channel.name}
                      channel={channel}
                      isChannel={true}
                    />
                  </div>
                ))}
              </List>
            </div>
          )}

          {isMessageForwarding && (
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white dark:bg-dark-200 bg-opacity-75 flex items-center justify-center">
              <Spinner className="w-4 h-4" />
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
