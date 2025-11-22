"use client";

import {
  useMattermostBootstrap,
  useMattermostChannels,
  useMattermostDirectChannel,
  useMattermostUserSearch
} from "@/features/chat/mattermost-api";
import { LoginRequired } from "@/features/shared";
import { UserAvatar } from "@/features/shared/user-avatar";
import Link from "next/link";
import { useClientActiveUser, useHydrated } from "@/api/queries";
import { useRouter } from "next/navigation";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { useMemo, useState } from "react";

const COMMUNITY_CHANNEL_NAME_PATTERN = /^hive-[a-z0-9-]+$/;

export function ChatsClient() {
  const activeUser = useClientActiveUser();
  const hydrated = useHydrated();
  const router = useRouter();
  const [dmUsername, setDmUsername] = useState("");
  const [channelSearch, setChannelSearch] = useState("");

  const { data: bootstrap, isLoading, error } = useMattermostBootstrap();
  const {
    data: channels,
    isLoading: channelsLoading,
    error: channelsError
  } = useMattermostChannels(Boolean(bootstrap?.ok));
  const {
    data: userSearch,
    isFetching: userSearchLoading,
    error: userSearchError
  } = useMattermostUserSearch(dmUsername, Boolean(bootstrap?.ok));
  const directChannelMutation = useMattermostDirectChannel();

  const filteredChannels = useMemo(() => {
    if (!channels?.channels) return [];

    const query = channelSearch.trim().toLowerCase();
    if (!query) return channels.channels;

    return channels.channels.filter((channel) => {
      const displayName = channel.display_name || channel.name;
      const directUsername = channel.directUser?.username || "";

      return (
        displayName.toLowerCase().includes(query) ||
        channel.name.toLowerCase().includes(query) ||
        directUsername.toLowerCase().includes(query)
      );
    });
  }, [channels?.channels, channelSearch]);

  const startDirectMessage = (username: string) => {
    const target = username.trim();
    if (!target) return;

    directChannelMutation.mutate(target, {
      onSuccess: (data) => {
        setDmUsername("");
        router.push(`/chats/${data.channelId}`);
      }
    });
  };

  if (!hydrated) {
    return (
      <div className="col-span-12 flex justify-center items-center p-4 md:p-10">
        <div className="text-sm text-[--text-muted]">Loading chats…</div>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="col-span-12 flex justify-center items-center p-4 md:p-10">
        <LoginRequired />
      </div>
    );
  }

  return (
    <div className="col-span-12 flex justify-center items-center p-4 md:p-10">
      <div className="w-full max-w-4xl space-y-6">
        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4">
          <h1 className="text-2xl font-semibold mb-2">Chats</h1>
          <p className="text-[--text-muted] text-sm">
            Your Ecency/Hive account is automatically provisioned inside Ecency Chats.
          </p>
        </div>

        {error && <div className="text-red-500 text-sm">{error.message}</div>}

        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Direct messages</h2>
            <p className="text-xs text-[--text-muted]">
              Start a private conversation with another Ecency user.
            </p>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                startDirectMessage(dmUsername);
              }}
            >
              <FormControl
                placeholder="Search or enter Hive username"
                value={dmUsername}
                onChange={(e) => setDmUsername(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={directChannelMutation.isLoading}>
                {directChannelMutation.isLoading ? "Starting…" : "Start DM"}
              </Button>
            </form>
            {directChannelMutation.error && (
              <div className="text-sm text-red-500 mt-2">
                {(directChannelMutation.error as Error).message}
              </div>
            )}
            {userSearchError && (
              <div className="text-sm text-red-500 mt-2">
                {(userSearchError as Error).message}
              </div>
            )}
            {(dmUsername.trim().length >= 2 || userSearchLoading) && (
              <div className="mt-3 space-y-2 rounded border border-[--border-color] p-3 bg-[--surface-color]">
                <div className="text-xs text-[--text-muted]">
                  {userSearchLoading ? "Searching users…" : "Select a user to start a DM"}
                </div>
                <div className="flex flex-col gap-2">
                  {userSearchLoading && <div className="text-sm text-[--text-muted]">Searching…</div>}
                  {!userSearchLoading &&
                    userSearch?.users?.map((user) => {
                      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
                      const secondary = user.nickname || fullName;

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => startDirectMessage(user.username)}
                          className="flex items-center justify-between gap-3 rounded border border-[--border-color] p-2 text-left hover:border-blue-500 transition"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              username={user.username}
                              size="medium"
                              className="h-9 w-9"
                            />
                            <div className="flex flex-col">
                              <span className="font-semibold">@{user.username}</span>
                              {secondary && (
                                <span className="text-xs text-[--text-muted]">{secondary}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-blue-500 font-semibold">Start</span>
                        </button>
                      );
                    })}
                  {!userSearchLoading && !userSearch?.users?.length && dmUsername.trim().length >= 2 && (
                    <div className="text-sm text-[--text-muted]">No users found.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <h2 className="text-lg font-semibold">Channels</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <FormControl
                type="search"
                placeholder="Search channels and DMs"
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              {(isLoading || channelsLoading) && <div className="text-xs text-[--text-muted]">Loading…</div>}
            </div>
          </div>
          {channelsError && (
            <div className="text-sm text-red-500">{(channelsError as Error).message}</div>
          )}
          <div className="grid gap-2">
            {filteredChannels.map((channel) => (
              <Link
                href={`/chats/${channel.id}`}
                key={channel.id}
                className="rounded border border-[--border-color] p-3 hover:border-blue-500 transition"
              >
                <div className="flex items-center gap-3">
                  {channel.type === "D" && channel.directUser ? (
                    <UserAvatar username={channel.directUser.username} size="medium" className="h-10 w-10" />
                  ) : COMMUNITY_CHANNEL_NAME_PATTERN.test(channel.name) ? (
                    <UserAvatar username={channel.name} size="medium" className="h-10 w-10" />
                  ) : (
                    <UserAvatar username={channel.name} size="medium" className="h-10 w-10" />
                  )}

                  <div className="flex flex-col flex-1">
                    <div className="font-semibold">{channel.display_name || channel.name}</div>
                    <div className="text-xs text-[--text-muted]">{channel.type === "D" ? "DM" : "Channel"}</div>
                  </div>

                  {(() => {
                    const unread = channel.type === "D" ? channel.message_count : channel.mention_count;

                    if (!unread) return null;

                    return (
                      <span className="ml-auto inline-flex min-w-[24px] justify-center rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                        {unread}
                      </span>
                    );
                  })()}
                </div>
              </Link>
            ))}
            {!filteredChannels.length && !channelsLoading && (
              <div className="text-sm text-[--text-muted]">
                {channelSearch.trim() ? "No channels match your search." : "No channels assigned yet."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
