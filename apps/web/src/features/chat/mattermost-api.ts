"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientActiveUser } from "@/api/queries";
import { getAccessToken, getRefreshToken } from "@/utils";

interface MattermostChannel {
  id: string;
  name: string;
  display_name: string;
  type: string;
  directUser?: MattermostUser | null;
  mention_count?: number;
  message_count?: number;
}

interface MattermostChannelSummary {
  id: string;
  name: string;
  display_name: string;
  type: string;
}

export function useMattermostBootstrap(community?: string) {
  const activeUser = useClientActiveUser();

  return useQuery({
    queryKey: ["mattermost-bootstrap", activeUser?.username, community],
    enabled: Boolean(activeUser?.username),
    queryFn: async () => {
      const accessToken = getAccessToken(activeUser?.username || "");
      const refreshToken = getRefreshToken(activeUser?.username || "");

      if (!accessToken && !refreshToken) {
        throw new Error("Authentication required");
      }

      const res = await fetch("/api/mattermost/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: activeUser?.username,
          accessToken,
          refreshToken,
          displayName: activeUser?.username,
          community
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to initialize chat");
      }

      return (await res.json()) as { ok: boolean; userId: string; channelId?: string | null };
    }
  });
}

export function useMattermostChannels(enabled: boolean) {
  return useQuery({
    queryKey: ["mattermost-channels"],
    enabled,
    queryFn: async () => {
      const res = await fetch("/api/mattermost/channels");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to load channels");
      }
      return (await res.json()) as { channels: MattermostChannel[] };
    }
  });
}

export function useMattermostUserSearch(term: string, enabled: boolean) {
  const query = term.trim();

  return useQuery({
    queryKey: ["mattermost-user-search", query],
    enabled: enabled && query.length >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/mattermost/users/search?q=${encodeURIComponent(query)}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to search users");
      }

      return (await res.json()) as { users: MattermostUser[] };
    }
  });
}

export function useMattermostUnread(enabled: boolean) {
  return useQuery({
    queryKey: ["mattermost-unread"],
    enabled,
    refetchInterval: 30000,
    queryFn: async () => {
      const res = await fetch("/api/mattermost/channels/unreads");

      if (res.status === 401) {
        return { channels: [], totalMentions: 0, totalDMs: 0, totalUnread: 0 } satisfies MattermostUnreadSummary;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to load unread counts");
      }

      return (await res.json()) as MattermostUnreadSummary;
    }
  });
}

export interface MattermostUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  last_picture_update?: number;
}

export interface MattermostPostsResponse {
  posts: MattermostPost[];
  users: Record<string, MattermostUser>;
  channel?: MattermostChannelSummary;
  community?: string | null;
  canModerate?: boolean;
}

export interface MattermostUnreadChannel {
  channelId: string;
  type: string;
  mention_count: number;
  message_count: number;
}

export interface MattermostUnreadSummary {
  channels: MattermostUnreadChannel[];
  totalMentions: number;
  totalDMs: number;
  totalUnread: number;
}

export function useMattermostPosts(channelId: string | undefined) {
  return useQuery({
    queryKey: ["mattermost-posts", channelId],
    enabled: Boolean(channelId),
    queryFn: async () => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/posts`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to load messages");
      }

      return (await res.json()) as MattermostPostsResponse;
    }
  });
}

export function useMattermostDeletePost(channelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/posts/${postId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to delete message");
      }

      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] });
    }
  });
}

export function useMattermostSendMessage(channelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to send message");
      }

      return (await res.json()) as { post: MattermostPost };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] });
    }
  });
}

export function useMattermostDirectChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/mattermost/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to start direct message");
      }

      return (await res.json()) as { channelId: string };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mattermost-channels"] });
    }
  });
}

export interface MattermostPostProps {
  username?: string;
  override_username?: string;
  addedUserId?: string;
  addedUsername?: string;
  from_webhook?: boolean;
  [key: string]: any;
}

export interface MattermostPost {
  id: string;
  user_id: string;
  message: string;
  create_at: number;
  type?: string;
  props?: MattermostPostProps;
}
