"use client";

import { useMemo } from "react";
import { useClientActiveUser, useHydrated } from "@/api/queries";
import { useMattermostBootstrap, useMattermostChannels } from "@/features/chat/mattermost-api";
import { MattermostChannelView } from "@/features/chat/mattermost-channel-view";
import { LoginRequired } from "@/features/shared";

const TOWN_HALL_CHANNEL_NAME = "town-hall";

export function ChatsPageClient() {
  const activeUser = useClientActiveUser();
  const hydrated = useHydrated();
  const { data: bootstrap, isLoading, error } = useMattermostBootstrap();
  const { data: channels, isLoading: channelsLoading } = useMattermostChannels(Boolean(bootstrap?.ok));

  const defaultChannelId = useMemo(() => {
    if (!channels?.channels?.length) return undefined;

    const townHallChannel = channels.channels.find((channel) => {
      const displayName = channel.display_name?.toLowerCase() || "";
      return channel.name.toLowerCase() === TOWN_HALL_CHANNEL_NAME || displayName === "town hall" || displayName === "town-hall";
    });

    return townHallChannel?.id || channels.channels[0]?.id;
  }, [channels?.channels]);

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-sm text-[--text-muted]">Loading chat…</div>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <LoginRequired />
      </div>
    );
  }

  if (!bootstrap && !isLoading && error?.message.includes("username")) {
    return <LoginRequired />;
  }

  if (!defaultChannelId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-sm text-[--text-muted]">
          {channelsLoading || isLoading ? "Loading chat…" : "No channels available"}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <MattermostChannelView channelId={defaultChannelId} />
    </div>
  );
}
