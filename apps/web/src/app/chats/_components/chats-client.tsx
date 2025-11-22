"use client";

import {
  useMattermostBootstrap,
  useMattermostChannels,
  useMattermostDirectChannel,
  useMattermostChannelSearch,
  useMattermostJoinChannel,
  useMattermostFavoriteChannel,
  useMattermostLeaveChannel,
  useMattermostMuteChannel,
  useMattermostUserSearch,
  useMattermostUnread
} from "@/features/chat/mattermost-api";
import { LoginRequired } from "@/features/shared";
import { UserAvatar } from "@/features/shared/user-avatar";
import Link from "next/link";
import { useClientActiveUser, useHydrated } from "@/api/queries";
import { useRouter } from "next/navigation";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { dotsHorizontal } from "@ui/svg";
import { MouseEvent, useMemo, useState } from "react";
import { Badge } from "@ui/badge";

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
    data: channelSearchResults,
    isFetching: channelSearchLoading,
    error: channelSearchError
  } = useMattermostChannelSearch(channelSearch, Boolean(bootstrap?.ok));
  const favoriteChannelMutation = useMattermostFavoriteChannel();
  const muteChannelMutation = useMattermostMuteChannel();
  const leaveChannelMutation = useMattermostLeaveChannel();
  const joinChannelMutation = useMattermostJoinChannel();
  const {
    data: userSearch,
    isFetching: userSearchLoading,
    error: userSearchError
  } = useMattermostUserSearch(dmUsername, Boolean(bootstrap?.ok));
  const directChannelMutation = useMattermostDirectChannel();
  const { data: unreadSummary } = useMattermostUnread(Boolean(bootstrap?.ok && activeUser && hydrated));

  const channelOrder = useMemo(() => {
    return new Map((channels?.channels || []).map((channel, index) => [channel.id, index]));
  }, [channels?.channels]);

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

  const sortedChannels = useMemo(() => {
    return [...filteredChannels].sort((a, b) => {
      if (a.is_favorite === b.is_favorite) {
        return (channelOrder.get(a.id) || 0) - (channelOrder.get(b.id) || 0);
      }

      return a.is_favorite ? -1 : 1;
    });
  }, [channelOrder, filteredChannels]);

  const joinableChannelResults = useMemo(() => {
    const existingIds = new Set((channels?.channels || []).map((channel) => channel.id));

    return (
      channelSearchResults?.channels?.filter((channel) => !existingIds.has(channel.id)) || []
    );
  }, [channelSearchResults?.channels, channels?.channels]);

  const unreadChannels = useMemo(() => {
    if (!unreadSummary?.channels?.length || !channels?.channels) return [];

    const channelMap = new Map(channels.channels.map((channel) => [channel.id, channel]));

    return unreadSummary.channels
      .map((channelUnread) => {
        const channel = channelMap.get(channelUnread.channelId);
        if (!channel) return null;

        const unread =
          channelUnread.type === "D" ? channelUnread.message_count : channelUnread.mention_count;

        if (!unread) return null;

        return {
          id: channel.id,
          name: channel.display_name || channel.name,
          unread
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.unread || 0) - (a?.unread || 0)) as {
      id: string;
      name: string;
      unread: number;
    }[];
  }, [channels?.channels, unreadSummary?.channels]);

  const unreadByChannelId = useMemo(() => {
    if (!unreadSummary?.channels) return new Map<string, { mention_count: number; message_count: number }>();

    return unreadSummary.channels.reduce((acc, channel) => {
      acc.set(channel.channelId, {
        mention_count: channel.mention_count,
        message_count: channel.message_count
      });
      return acc;
    }, new Map<string, { mention_count: number; message_count: number }>());
  }, [unreadSummary?.channels]);

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

  const joinChannel = (channelId: string) => {
    joinChannelMutation.mutate(channelId, {
      onSuccess: () => {
        setChannelSearch("");
        router.push(`/chats/${channelId}`);
      }
    });
  };

  const handleChannelAction = (e: MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
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
          {unreadSummary && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-200">
                Mentions: <span className="ml-1 font-semibold">{unreadSummary.totalMentions}</span>
              </Badge>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-200">
                DMs: <span className="ml-1 font-semibold">{unreadSummary.totalDMs}</span>
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-200">
                Total unread: <span className="ml-1 font-semibold">{unreadSummary.totalUnread}</span>
              </Badge>
              {!!unreadChannels.length && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {unreadChannels.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => router.push(`/chats/${channel.id}`)}
                      className="inline-flex items-center gap-2 rounded-full border border-[--border-color] bg-[--surface-color] px-3 py-1 text-sm hover:border-blue-500"
                    >
                      <span className="font-semibold">{channel.name}</span>
                      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {channel.unread}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
          {channelSearchError && (
            <div className="text-sm text-red-500">{(channelSearchError as Error).message}</div>
          )}
          {joinChannelMutation.error && (
            <div className="text-sm text-red-500">{(joinChannelMutation.error as Error).message}</div>
          )}
          <div className="grid gap-2">
            {sortedChannels.map((channel) => (
              <Link
                href={`/chats/${channel.id}`}
                key={channel.id}
                className="rounded border border-[--border-color] p-3 hover:border-blue-500 transition"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const unreadCounts = unreadByChannelId.get(channel.id);
                    const mentionCount = channel.mention_count ?? unreadCounts?.mention_count ?? 0;
                    const messageCount = channel.message_count ?? unreadCounts?.message_count ?? 0;
                    const unread = channel.type === "D" ? messageCount : mentionCount;

                    return (
                      <div className="relative">
                        {channel.type === "D" && channel.directUser ? (
                          <UserAvatar username={channel.directUser.username} size="medium" className="h-10 w-10" />
                        ) : COMMUNITY_CHANNEL_NAME_PATTERN.test(channel.name) ? (
                          <UserAvatar username={channel.name} size="medium" className="h-10 w-10" />
                        ) : (
                          <UserAvatar username={channel.name} size="medium" className="h-10 w-10" />
                        )}
                        {unread > 0 && (
                          <span
                            className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-[--surface-color]"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex flex-col flex-1">
                    <div className="font-semibold flex items-center gap-1">
                      <span>{channel.display_name || channel.name}</span>
                      {channel.is_favorite && (
                        <span className="text-amber-500" aria-label="Favorite channel" title="Favorite channel">
                          ★
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[--text-muted]">{channel.type === "D" ? "DM" : "Channel"}</div>
                  </div>

                  {(() => {
                    const unreadCounts = unreadByChannelId.get(channel.id);
                    const mentionCount = channel.mention_count ?? unreadCounts?.mention_count ?? 0;
                    const messageCount = channel.message_count ?? unreadCounts?.message_count ?? 0;
                    const unread = channel.type === "D" ? messageCount : mentionCount;

                    if (!unread) return null;

                    return (
                      <span className="ml-auto inline-flex min-w-[24px] justify-center rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                        {unread}
                      </span>
                    );
                  })()}

                  {channel.type !== "D" && (
                    <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                      <Dropdown>
                        <DropdownToggle onClick={(e) => e.preventDefault()}>
                          <Button
                            appearance="gray-link"
                            icon={dotsHorizontal}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          />
                        </DropdownToggle>
                        <DropdownMenu align="end">
                          <DropdownItemWithIcon
                            label="Favorite channel"
                            onClick={(e: MouseEvent) =>
                              handleChannelAction(e, () => favoriteChannelMutation.mutate({ channelId: channel.id, favorite: true }))
                            }
                          />
                          <DropdownItemWithIcon
                            label="Mute channel"
                            onClick={(e: MouseEvent) =>
                              handleChannelAction(e, () => muteChannelMutation.mutate({ channelId: channel.id, mute: true }))
                            }
                          />
                          <DropdownItemWithIcon
                            label="Leave channel"
                            onClick={(e: MouseEvent) => handleChannelAction(e, () => leaveChannelMutation.mutate(channel.id))}
                          />
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {!sortedChannels.length && !channelsLoading && (
              <div className="text-sm text-[--text-muted]">
                {channelSearch.trim() ? "No channels match your search." : "No channels assigned yet."}
              </div>
            )}
          </div>

          {channelSearch.trim().length >= 2 && (
            <div className="mt-4 space-y-2 rounded border border-[--border-color] bg-[--background-color] p-3">
              <div className="flex items-center justify-between text-xs text-[--text-muted]">
                <span>Joinable channels</span>
                {channelSearchLoading && <span>Searching…</span>}
              </div>
              <div className="grid gap-2">
                {joinableChannelResults.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between rounded border border-[--border-color] bg-[--surface-color] p-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{channel.display_name || channel.name}</span>
                      <span className="text-xs text-[--text-muted]">
                        {channel.type === "O" ? "Public channel" : channel.type === "P" ? "Private channel" : "Channel"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => joinChannel(channel.id)}
                      disabled={joinChannelMutation.isPending}
                    >
                      {joinChannelMutation.isPending ? "Joining…" : "Join"}
                    </Button>
                  </div>
                ))}
                {!channelSearchLoading && !joinableChannelResults.length && (
                  <div className="text-sm text-[--text-muted]">No additional channels found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
