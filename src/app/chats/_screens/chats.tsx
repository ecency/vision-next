"use client";

import React, { useContext, useEffect, useMemo } from "react";
import { ChatsSideBar } from "@/app/chats/_components/chats-sidebar";
import { ChatsMessagesBox } from "@/app/chats/_components/chat-message-box";
import { ChatsWelcome } from "@/app/chats/_components/chats-welcome";
import { ChatsDefaultScreen } from "@/app/chats/_components/chats-default-screen";
import { ChatsManageKeySection } from "./chats-manage-key-section";
import { ChatsUserNotJoinedSection } from "./chats-user-not-joined-section";
import {
  ChatContext,
  useChannelsQuery,
  useCommunityChannelQuery,
  useDirectContactsQuery,
  useKeysQuery
} from "@ecency/ns-query";
import { useUnmount } from "react-use";
import { useCreateTemporaryContactFromParam } from "../_hooks";
import { getCommunityCache } from "@/core/caches";
import i18next from "i18next";
import { classNameObject } from "@ui/util";
import {useClientActiveUser} from "@/api/queries";
import {LoginRequired} from "@/features/shared";
import {Button} from "@ui/button";
import { UilComment } from "@tooni/iconscout-unicons-react";

interface Props {
  params?: string[];
}

export const ChatsScreen = ({ params = [] }: Props) => {
  const activeUser = useClientActiveUser();
  const { receiverPubKey, revealPrivateKey, setReceiverPubKey } = useContext(ChatContext);

  const { data: community } = getCommunityCache(params[0] as string).useClientQuery();

  useCreateTemporaryContactFromParam();
  const { publicKey, privateKey } = useKeysQuery();
  const { data: directContacts } = useDirectContactsQuery();
  const { data: channels } = useChannelsQuery();

  const isChannel = useMemo(() => params[1] === "channel", [params]);

  const directContact = useMemo(
    () => directContacts?.find((dc) => dc.pubkey === receiverPubKey),
    [directContacts, receiverPubKey]
  );
  const { data: communityChannel } = useCommunityChannelQuery(
    isChannel && community ? community : undefined
  );

  const isReady = useMemo(
    () => !!(activeUser && publicKey && privateKey),
    [publicKey, privateKey, activeUser]
  );
  const isShowManageKey = useMemo(() => isReady && revealPrivateKey, [isReady, revealPrivateKey]);
  const isShowChatRoom = useMemo(
    () => isReady && (!!directContact || !!communityChannel) && !revealPrivateKey,
    [isReady, revealPrivateKey, communityChannel, directContact]
  );
  const isShowImportChats = useMemo(() => !isReady, [isReady]);
  const isShowUserNotJoined = useMemo(
    () =>
      !isShowChatRoom &&
      isReady &&
      (!!directContact?.pubkey.startsWith("not_joined_") || (community && !communityChannel)),
    [isShowChatRoom, isReady, directContact, communityChannel, community]
  );

  const isShowDefaultScreen = useMemo(
    () =>
      isReady &&
      !directContact &&
      !communityChannel &&
      !revealPrivateKey &&
      !receiverPubKey &&
      !isShowUserNotJoined,
    [
      isReady,
      directContact,
      communityChannel,
      revealPrivateKey,
      receiverPubKey,
      isShowUserNotJoined
    ]
  );

  const title = useMemo(() => {
    let title = i18next.t("chat.page-title");

    if (community) {
      title = `${community.title} | ${title}`;
    } else if (directContact) {
      title = `${directContact.name} | ${title}`;
    }

    return title;
  }, [community, directContact]);

  useUnmount(() => {
    setReceiverPubKey("");
  });

  useEffect(() => {
    if (communityChannel) {
      setReceiverPubKey("");
    }
  }, [communityChannel, setReceiverPubKey]);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return activeUser ? (
    <>
      <div className="col-span-12 md:col-span-4 xl:col-span-3 md:border-r border-[--border-color] md:h-[calc(100vh-69px-3rem)] overflow-y-auto">
        {isReady ? <ChatsSideBar isChannel={isChannel} username={params[0] as string} /> : <></>}
        {(!directContacts?.length || !channels?.length) && isShowDefaultScreen && (
          <ChatsDefaultScreen className="md:hidden" />
        )}
        {(!directContacts?.length || !channels?.length) && isShowImportChats && activeUser && (
          <div className="md:h-full w-full flex items-center justify-center md:hidden">
            <ChatsWelcome />
          </div>
        )}
        {isShowUserNotJoined && (
          <ChatsUserNotJoinedSection
            username={directContact?.name ?? community?.name ?? ""}
            className="md:hidden"
          />
        )}
      </div>
      <div
        className={classNameObject({
          "col-span-12 md:col-span-8 xl:col-span-9 md:h-[calc(100vh-69px-3rem)] md:overflow-y-auto absolute w-full bg-white z-10 md:static":
            true,
          "translate-x-0": isShowChatRoom || isShowManageKey,
          "translate-x-[100%] md:translate-x-0": !isShowChatRoom && !isShowManageKey
        })}
      >
        {isShowManageKey && <ChatsManageKeySection />}
        {isShowImportChats && activeUser && (
          <div className="md:h-full w-full flex items-center justify-center">
            <ChatsWelcome />
          </div>
        )}
        {isShowChatRoom && (
          <ChatsMessagesBox
            community={community}
            channel={communityChannel!!}
            currentContact={directContact}
          />
        )}
        {isShowUserNotJoined && (
          <ChatsUserNotJoinedSection username={directContact?.name ?? community?.name ?? ""} />
        )}
        {isShowDefaultScreen && <ChatsDefaultScreen />}
      </div>
    </>
  ) : (
      <div className="fixed left-0 right-0 top-[64px] bottom-0 z-50 bg-cover flex flex-col items-center justify-center text-center p-6"
             style={{
               backgroundImage: "url(/assets/promote-wave-bg.jpg)"
           }}
      >
          <UilComment className="text-white mb-4" size="48" />
          <div
              className="text-white max-w-[320px] mb-4 mx-auto"
              style={{ textShadow: "rgba(0,0,0,.25) 0 0 4px" }}
          >
              <div className="font-semibold text-xl mb-1">{i18next.t("discussion.join")}</div>
              <div className="text-sm">{i18next.t("discussion.join-hint")}</div>
          </div>
          <LoginRequired>
              <Button appearance="white" icon="🔥" size="lg">
                  {i18next.t("discussion.btn-join")}
              </Button>
          </LoginRequired>
      </div>
  );
};
