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
  useMattermostMessageSearch,
  useMattermostUnread,
  useMattermostMarkChannelViewed,
  type MattermostUser
} from "@/features/chat/mattermost-api";
import { LoginRequired } from "@/features/shared";
import { UserAvatar } from "@/features/shared/user-avatar";
import i18next from "i18next";
import Link from "next/link";
import { useClientActiveUser, useHydrated } from "@/api/queries";
import { useRouter } from "next/navigation";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { checkSvg, dotsHorizontal, volumeOffSvg } from "@ui/svg";
import { MouseEvent, useCallback, useMemo, useState } from "react";

const COMMUNITY_CHANNEL_NAME_PATTERN = /^hive-[a-z0-9-]+$/;

export function ChatsClient() {
  const activeUser = useClientActiveUser();
  const hydrated = useHydrated();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

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
  } = useMattermostChannelSearch(searchTerm, Boolean(bootstrap?.ok));
  const {
    data: messageSearchResults,
    isFetching: messageSearchLoading,
    error: messageSearchError
  } = useMattermostMessageSearch(searchTerm, Boolean(bootstrap?.ok));
  const favoriteChannelMutation = useMattermostFavoriteChannel();
  const muteChannelMutation = useMattermostMuteChannel();
  const leaveChannelMutation = useMattermostLeaveChannel();
  const joinChannelMutation = useMattermostJoinChannel();
  const markChannelViewedMutation = useMattermostMarkChannelViewed();
  const {
    data: userSearch,
    isFetching: userSearchLoading,
    error: userSearchError
  } = useMattermostUserSearch(searchTerm, Boolean(bootstrap?.ok));
  const directChannelMutation = useMattermostDirectChannel();
  const { data: unreadSummary } = useMattermostUnread(Boolean(bootstrap?.ok && activeUser && hydrated));

  const channelOrder = useMemo(() => {
    return new Map((channels?.channels || []).map((channel, index) => [channel.id, index]));
  }, [channels?.channels]);

  const channelsById = useMemo(() => {
    return new Map((channels?.channels || []).map((channel) => [channel.id, channel]));
  }, [channels?.channels]);

  const getDirectUserDisplayName = useCallback((user?: MattermostUser | null) => {
    if (!user) return undefined;

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    if (fullName) return fullName;

    if (user.nickname) return user.nickname;

    if (user.username) return `@${user.username}`;

    return undefined;
  }, []);

  const filteredChannels = useMemo(() => {
    if (!channels?.channels) return [];

    const query = searchTerm.trim().toLowerCase();
    if (!query) return channels.channels;

    return channels.channels.filter((channel) => {
      const displayName = channel.display_name || channel.name;
      const directUsername = channel.directUser?.username || "";
      const directDisplayName = getDirectUserDisplayName(channel.directUser) || "";

      return (
        displayName.toLowerCase().includes(query) ||
        channel.name.toLowerCase().includes(query) ||
        directUsername.toLowerCase().includes(query) ||
        directDisplayName.toLowerCase().includes(query)
      );
    });
  }, [channels?.channels, getDirectUserDisplayName, searchTerm]);

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

  const getUnreadCount = useCallback(
    (channel: (typeof filteredChannels)[number]) => {
      const unreadCounts = unreadByChannelId.get(channel.id);
      const mentionCount = channel.mention_count ?? unreadCounts?.mention_count ?? 0;
      const messageCount = channel.message_count ?? unreadCounts?.message_count ?? 0;

      return channel.type === "D" ? messageCount : Math.max(messageCount, mentionCount);
    },
    [unreadByChannelId]
  );

  const sortedChannels = useMemo(() => {
    return [...filteredChannels].sort((a, b) => {
      const aUnread = getUnreadCount(a) > 0;
      const bUnread = getUnreadCount(b) > 0;

      if (aUnread !== bUnread) {
        return aUnread ? -1 : 1;
      }

      if (a.is_favorite === b.is_favorite) {
        return (channelOrder.get(a.id) || 0) - (channelOrder.get(b.id) || 0);
      }

      return a.is_favorite ? -1 : 1;
    });
  }, [channelOrder, filteredChannels, getUnreadCount]);

  const joinableChannelResults = useMemo(() => {
    const existingIds = new Set((channels?.channels || []).map((channel) => channel.id));

    return (
      channelSearchResults?.channels?.filter((channel) => !existingIds.has(channel.id)) || []
    );
  }, [channelSearchResults?.channels, channels?.channels]);

  const startDirectMessage = (username: string) => {
    const target = username.trim();
    if (!target) return;

    directChannelMutation.mutate(target, {
      onSuccess: (data) => {
        setSearchTerm("");
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

  const handleChannelLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const targetElement = event.target as HTMLElement | null;

    if (targetElement?.closest("[data-chat-channel-actions]")) {
      event.preventDefault();
    }
  }, []);

  const getChannelTitle = useCallback(
    (channel: (typeof filteredChannels)[number]) => {
      if (channel.type === "D") {
        const displayName = getDirectUserDisplayName(channel.directUser);
        if (displayName) return displayName;
      }

      return channel.display_name || channel.name;
    },
    [getDirectUserDisplayName]
  );

  const getChannelSubtitle = useCallback(
    (channel: (typeof filteredChannels)[number]) => {
      if (channel.type === "D") {
        if (channel.directUser?.username) return `@${channel.directUser.username}`;

        return i18next.t("chat.channel-type-dm");
      }

      return i18next.t("chat.channel-type");
    },
    []
  );

  const formatTimestamp = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }),
    []
  );

  const subscribedMessageResults = useMemo(() => {
    return (messageSearchResults?.posts || []).filter((post) => channelsById.has(post.channel_id));
  }, [channelsById, messageSearchResults?.posts]);

  const trimmedSearch = searchTerm.trim();
  const hasSearchTerm = trimmedSearch.length >= 2;

  if (!hydrated) {
    return (
      <div className="col-span-12 flex justify-center items-center p-4 md:p-10">
        <div className="text-sm text-[--text-muted]">{i18next.t("chat.loading-chats")}</div>
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

        {error && <div className="text-red-500 text-sm">{error.message}</div>}

        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4 space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{i18next.t("chat.title")}</h2>
              <p className="text-xs text-[--text-muted]">{i18next.t("chat.page-title")}</p>
            </div>
            {(isLoading || channelsLoading) && (
              <div className="text-xs text-[--text-muted]">{i18next.t("chat.loading")}</div>
            )}
          </div>

          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <FormControl
              type="search"
              placeholder={i18next.t("chat.search-channels")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            {searchTerm && (
              <Button type="button" appearance="secondary" onClick={() => setSearchTerm("")}>
                Clear
              </Button>
            )}
          </form>

          {(channelsError || channelSearchError || messageSearchError || joinChannelMutation.error ||
            directChannelMutation.error || userSearchError) && (
            <div className="grid gap-1 text-sm text-red-500">
              {channelsError && <div>{(channelsError as Error).message}</div>}
              {channelSearchError && <div>{(channelSearchError as Error).message}</div>}
              {messageSearchError && <div>{(messageSearchError as Error).message}</div>}
              {joinChannelMutation.error && <div>{(joinChannelMutation.error as Error).message}</div>}
              {directChannelMutation.error && <div>{(directChannelMutation.error as Error).message}</div>}
              {userSearchError && <div>{(userSearchError as Error).message}</div>}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[--text-muted]">
                    {hasSearchTerm && i18next.t("chat.searching-channels")}
                  </p>
                </div>
                {hasSearchTerm && channelSearchLoading && (
                  <span className="text-xs text-[--text-muted]">{i18next.t("chat.searching")}</span>
                )}
              </div>

              <div className="grid gap-2">
                {sortedChannels.map((channel) => {
                  const unread = getUnreadCount(channel);
                  const isMuted = Boolean(channel.is_muted);
                  const markAsReadLabel = markChannelViewedMutation.isPending
                    ? i18next.t("chat.marking-as-read")
                    : i18next.t("chat.mark-as-read");
                  const favoriteLabel = channel.is_favorite
                    ? i18next.t("favorite-btn.delete")
                    : i18next.t("chat.favorite-channel");
                  const muteLabel = i18next.t(isMuted ? "chat.unmute-channel" : "chat.mute-channel");

                  return (
                    <Link
                      href={`/chats/${channel.id}`}
                      key={channel.id}
                      className="rounded border border-[--border-color] p-3 hover:border-blue-500 transition"
                      onClickCapture={handleChannelLinkClick}
                    >
                      <div className="flex items-center gap-3">
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
                              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[--primary-color] ring-2 ring-[--surface-color]"
                              aria-hidden="true"
                            />
                          )}
                        </div>

                        <div className="flex flex-col flex-1">
                          <div className="font-semibold flex items-center gap-1.5">
                            <span>{getChannelTitle(channel)}</span>
                            {channel.is_favorite && (
                              <span className="text-amber-500" aria-label="Favorite channel" title="Favorite channel">
                                ★
                              </span>
                            )}
                            {isMuted && (
                              <span
                                className="text-[--text-muted]"
                                aria-label={i18next.t("chat.channel-muted")}
                                title={i18next.t("chat.channel-muted")}
                              >
                                {volumeOffSvg}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[--text-muted]">
                            {getChannelSubtitle(channel)}
                          </div>
                        </div>

                        {unread > 0 && (
                          <span className="ml-auto inline-flex min-w-[24px] justify-center rounded-full bg-[--primary-color] px-2 py-1 text-xs font-semibold text-[--primary-button-text-color]">
                            {unread}
                          </span>
                        )}

                        {channel.type !== "D" ? (
                          <div
                            className="ml-2"
                            data-chat-channel-actions
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Dropdown>
                              <DropdownToggle
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <Button appearance="gray-link" icon={dotsHorizontal} />
                              </DropdownToggle>
                              <DropdownMenu align="right">
                                {unread > 0 && (
                                  <DropdownItemWithIcon
                                    icon={checkSvg}
                                    label={markAsReadLabel}
                                    onClick={(e: MouseEvent) =>
                                      handleChannelAction(e, () => markChannelViewedMutation.mutate(channel.id))
                                    }
                                    disabled={markChannelViewedMutation.isPending}
                                  />
                                )}
                                <DropdownItemWithIcon
                                  label={favoriteLabel}
                                  onClick={(e: MouseEvent) =>
                                    handleChannelAction(e, () =>
                                      favoriteChannelMutation.mutate({
                                        channelId: channel.id,
                                        favorite: !channel.is_favorite
                                      })
                                    )
                                  }
                                />
                                <DropdownItemWithIcon
                                  label={muteLabel}
                                  onClick={(e: MouseEvent) =>
                                    handleChannelAction(e, () =>
                                      muteChannelMutation.mutate({ channelId: channel.id, mute: !isMuted })
                                    )
                                  }
                                />
                                <DropdownItemWithIcon
                                  label={i18next.t("chat.leave-channel")}
                                  onClick={(e: MouseEvent) =>
                                    handleChannelAction(e, () => leaveChannelMutation.mutate(channel.id))
                                  }
                                />
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        ) : (
                          unread > 0 && (
                            <div
                              className="ml-2"
                              data-chat-channel-actions
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Dropdown>
                                <DropdownToggle
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  <Button appearance="gray-link" icon={dotsHorizontal} />
                                </DropdownToggle>
                                <DropdownMenu align="right">
                                  <DropdownItemWithIcon
                                    icon={checkSvg}
                                    label={markAsReadLabel}
                                    onClick={(e: MouseEvent) =>
                                      handleChannelAction(e, () => markChannelViewedMutation.mutate(channel.id))
                                    }
                                    disabled={markChannelViewedMutation.isPending}
                                  />
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                          )
                        )}
                      </div>
                    </Link>
                  );
                })}
                {!sortedChannels.length && !channelsLoading && (
                  <div className="text-sm text-[--text-muted]">
                    {hasSearchTerm
                      ? i18next.t("chat.no-channels-search")
                      : i18next.t("chat.no-channels")}
                  </div>
                )}
              </div>
            </div>

            {hasSearchTerm && (
              <div className="space-y-2 rounded border border-[--border-color] bg-[--background-color] p-3">
                <div className="flex items-center justify-between text-xs text-[--text-muted]">
                  <span>{i18next.t("chat.search-user")}</span>
                  {userSearchLoading && <span>{i18next.t("chat.searching")}</span>}
                </div>
                <div className="grid gap-2">
                  {userSearchLoading && <div className="text-sm text-[--text-muted]">{i18next.t("chat.searching")}</div>}
                  {!userSearchLoading &&
                    userSearch?.users?.map((user) => {
                      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
                      const secondary = user.nickname || fullName;

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => startDirectMessage(user.username)}
                          className="flex items-center justify-between gap-3 rounded border border-[--border-color] bg-[--surface-color] p-2 text-left hover:border-blue-500 transition"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar username={user.username} size="medium" className="h-9 w-9" />
                            <div className="flex flex-col">
                              <span className="font-semibold">@{user.username}</span>
                              {secondary && (
                                <span className="text-xs text-[--text-muted]">{secondary}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-blue-500 font-semibold">
                            {directChannelMutation.isLoading
                              ? i18next.t("chat.starting-dm")
                              : i18next.t("chat.start-dm-button")}
                          </span>
                        </button>
                      );
                    })}
                  {!userSearchLoading && !userSearch?.users?.length && (
                    <div className="text-sm text-[--text-muted]">{i18next.t("chat.no-user")}</div>
                  )}
                </div>
              </div>
            )}

            {hasSearchTerm && (
              <div className="space-y-2 rounded border border-[--border-color] bg-[--background-color] p-3">
                <div className="flex items-center justify-between text-xs text-[--text-muted]">
                  <span>{i18next.t("chat.joinable-channels")}</span>
                  {channelSearchLoading && <span>{i18next.t("chat.searching-channels")}</span>}
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
                          {channel.type === "O"
                            ? i18next.t("chat.channel-type-public")
                            : channel.type === "P"
                              ? i18next.t("chat.channel-type-private")
                              : i18next.t("chat.channel-type")}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => joinChannel(channel.id)}
                        disabled={joinChannelMutation.isPending}
                      >
                        {joinChannelMutation.isPending
                          ? i18next.t("chat.joining-channel")
                          : i18next.t("chat.join-channel-action")}
                      </Button>
                    </div>
                  ))}
                  {!channelSearchLoading && !joinableChannelResults.length && (
                    <div className="text-sm text-[--text-muted]">
                      {i18next.t("chat.no-additional-channels")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasSearchTerm && (
              <div className="space-y-2 rounded border border-[--border-color] bg-[--background-color] p-3">
                <div className="flex items-center justify-between text-xs text-[--text-muted]">
                  <span>{i18next.t("chat.message-search-results")}</span>
                  {messageSearchLoading && <span>{i18next.t("chat.searching")}</span>}
                </div>
                <div className="grid gap-2">
                  {subscribedMessageResults.map((post) => {
                    const channel = channelsById.get(post.channel_id);
                    const channelLabel = channel ? getChannelTitle(channel) : i18next.t("chat.channel-type");
                    const channelSubtitle = channel ? getChannelSubtitle(channel) : undefined;

                    return (
                      <Link
                        key={post.id}
                        href={`/chats/${post.channel_id}?post=${post.id}`}
                        className="flex flex-col gap-1 rounded border border-[--border-color] bg-[--surface-color] p-3 hover:border-blue-500 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-semibold line-clamp-2 whitespace-pre-wrap break-words">
                              {post.message || i18next.t("chat.no-message")}
                            </div>
                            <div className="text-xs text-[--text-muted]">
                              {channelLabel}
                              {channelSubtitle ? ` • ${channelSubtitle}` : ""}
                            </div>
                          </div>
                          <span className="text-[11px] text-[--text-muted]">
                            {formatTimestamp.format(new Date(post.create_at))}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  {!messageSearchLoading && !subscribedMessageResults.length && (
                    <div className="text-sm text-[--text-muted]">{i18next.t("chat.no-messages-found")}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
