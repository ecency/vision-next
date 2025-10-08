import { ChatsProfileBox } from "../chat-profile-box";
import { ChatsDirectMessages } from "../chats-direct-messages";
import React, { useEffect, useMemo } from "react";
import { ChatsChannelMessages } from "../chat-channel-messages";
import {
  Channel,
  DirectContact,
  DirectMessage,
  PublicMessage,
  useDirectContactsQuery,
  useKeysQuery,
  useMessagesQuery,
  useUpdateChannelLastSeenDate,
  useUpdateDirectContactsLastSeenDate
} from "@ecency/ns-query";
import { getCommunityCache } from "@/core/caches";
import Link from "next/link";

interface Props {
  currentContact?: DirectContact;
  currentChannel?: Channel;
}

export function ChatPopupMessagesList({ currentContact, currentChannel }: Props) {
  const { data: currentCommunity } = getCommunityCache(
    currentChannel?.communityName
  ).useClientQuery();

  const { publicKey } = useKeysQuery();
  const messages = useMessagesQuery(currentContact, currentChannel);
  const { isSuccess: isDirectContactsLoaded } = useDirectContactsQuery();

  const { mutateAsync: updateDirectContactsLastSeenDate } = useUpdateDirectContactsLastSeenDate();
  const { mutateAsync: updateChannelLastSeenDate } = useUpdateChannelLastSeenDate();

  const isActiveUser = useMemo(
    () => currentContact?.pubkey === publicKey,
    [publicKey, currentContact]
  );

  // Whenever current contact is exists need to turn unread to 0
  useEffect(() => {
    if (currentContact && isDirectContactsLoaded) {
      updateDirectContactsLastSeenDate({
        contact: currentContact,
        lastSeenDate: new Date()
      });
    }
  }, [currentContact, isDirectContactsLoaded]);

  useEffect(() => {
    if (currentChannel) {
      updateChannelLastSeenDate({
        channel: currentChannel,
        lastSeenDate: new Date()
      });
    }
  }, [currentChannel, updateChannelLastSeenDate]);

  return (
    <div className="chats h-full">
      {" "}
      {!isActiveUser && (
        <Link
          href={
            !!currentChannel ? `/created/${currentCommunity?.name}` : `/@${currentContact?.name}`
          }
        >
          <ChatsProfileBox
            communityName={currentChannel?.communityName}
            currentUser={currentContact?.name}
          />
        </Link>
      )}
      {!!currentChannel ? (
        <ChatsChannelMessages
          publicMessages={messages as PublicMessage[]}
          currentChannel={currentChannel!}
        />
      ) : (
        <ChatsDirectMessages
          directMessages={messages as DirectMessage[]}
          currentContact={currentContact!!}
        />
      )}
    </div>
  );
}
