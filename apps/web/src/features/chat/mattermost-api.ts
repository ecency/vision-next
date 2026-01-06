"use client";

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken, getRefreshToken } from "@/utils";
import { useGlobalStore } from "@/core/global-store";
import { hsTokenRenew } from "@/api/auth-api";

interface MattermostChannel {
  id: string;
  name: string;
  display_name: string;
  type: string;
  is_favorite?: boolean;
  is_muted?: boolean;
  directUser?: MattermostUser | null;
  mention_count?: number;
  message_count?: number;
  last_post_at?: number;
  last_viewed_at?: number;
}

interface MattermostChannelSummary {
  id: string;
  name: string;
  display_name: string;
  type: string;
}

export function useMattermostBootstrap(community?: string) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const addUser = useGlobalStore((state) => state.addUser);

  return useQuery({
    queryKey: ["mattermost-bootstrap", username, community],
    enabled: Boolean(username),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true, // Auto-retry when user returns to tab
    retry: (failureCount, error) => {
      // Don't retry on auth errors after refresh attempt fails
      const errorMessage = (error as Error)?.message?.toLowerCase() || "";
      const isAuthError =
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("invalid token") ||
        errorMessage.includes("authentication required");

      if (isAuthError) {
        return false; // Don't retry auth errors
      }

      // Retry other errors (network, server issues) up to 3 times
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    queryFn: async () => {
      let accessToken = getAccessToken(username || "");
      let refreshToken = getRefreshToken(username || "");

      if (!accessToken && !refreshToken) {
        throw new Error("Authentication required");
      }

      // First attempt with existing tokens
      let res = await fetch("/api/mattermost/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          accessToken,
          refreshToken,
          displayName: username,
          community
        })
      });

      // If unauthorized and we have a refresh token, attempt token refresh
      if (res.status === 401 && refreshToken) {
        try {
          console.log("Chat token expired, attempting auto-refresh...");

          // Call HiveSigner to refresh tokens
          const refreshedTokens = await hsTokenRenew(refreshToken);

          // Update tokens in global store (saves to localStorage)
          addUser({
            username: refreshedTokens.username,
            accessToken: refreshedTokens.access_token,
            refreshToken: refreshedTokens.refresh_token,
            expiresIn: refreshedTokens.expires_in,
            postingKey: activeUser?.postingKey,
            loginType: activeUser?.loginType
          });

          console.log("✓ Chat tokens refreshed successfully");

          // Retry bootstrap with refreshed tokens
          res = await fetch("/api/mattermost/bootstrap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username,
              accessToken: refreshedTokens.access_token,
              refreshToken: refreshedTokens.refresh_token,
              displayName: username,
              community
            })
          });
        } catch (refreshError) {
          console.error("Failed to refresh tokens:", refreshError);
          throw new Error("Authentication required - please log in again");
        }
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to initialize chat");
      }

      return (await res.json()) as { ok: boolean; userId: string; channelId?: string | null };
    }
  });
}

export function useMattermostChannels(enabled: boolean) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  return useQuery({
    queryKey: ["mattermost-channels", username],
    enabled: enabled && Boolean(username),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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

export function useMattermostFavoriteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channelId, favorite }: { channelId: string; favorite: boolean }) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to update favorite");
      }

      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mattermost-channels"] });
    }
  });
}

export function useMattermostMuteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channelId, mute }: { channelId: string; mute: boolean }) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/mute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mute })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to update mute state");
      }

      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mattermost-channels"] });
    }
  });
}

export function useMattermostLeaveChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/leave`, {
        method: "POST"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to leave channel");
      }

      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mattermost-channels"] });
    }
  });
}

export function useMattermostJoinChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/join`, { method: "POST" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to join channel");
      }

      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async (_data, channelId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mattermost-channels"] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite", channelId] })
      ]);
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

export function useMattermostChannelSearch(term: string, enabled: boolean) {
  const query = term.trim();

  return useQuery({
    queryKey: ["mattermost-channel-search", query],
    enabled: enabled && query.length >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/mattermost/channels/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: query })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to search channels");
      }

      return (await res.json()) as { channels: MattermostChannelSummary[] };
    }
  });
}

export function useMattermostMessageSearch(term: string, enabled: boolean) {
  const query = term.trim();

  return useQuery({
    queryKey: ["mattermost-message-search", query],
    enabled: enabled && query.length >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/mattermost/search/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: query })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to search messages");
      }

      return (await res.json()) as MattermostPostSearchResponse;
    }
  });
}

export function useMattermostAdminBanUser() {
  return useMutation({
    mutationFn: async ({
      username,
      hours
    }: {
      username: string;
      hours: number | string | null | undefined;
    }) => {
      const res = await fetch(`/api/mattermost/admin/users/${encodeURIComponent(username)}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to update ban");
      }

      return (await res.json()) as { bannedUntil: number | null };
    }
  });
}

export function useMattermostAdminDeleteUserPosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/mattermost/admin/users/${encodeURIComponent(username)}/posts`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to delete posts");
      }

      return (await res.json()) as { deleted: number };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite"] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-channels"] })
      ]);
    }
  });
}

export function useMattermostUnread(enabled: boolean) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  return useQuery({
    queryKey: ["mattermost-unread", username],
    enabled: enabled && Boolean(username),
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

export function useMattermostMarkChannelViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/view`, { method: "POST" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to mark channel as read");
      }

      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async (_data, channelId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mattermost-unread"] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-channels"] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite", channelId] })
      ]);
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
  member?: {
    last_viewed_at?: number;
    mention_count?: number;
    msg_count?: number;
  };
  community?: string | null;
  canModerate?: boolean;
  hasMore?: boolean;
  memberCount?: number;
  onlineUserIds?: string[];
}

export interface MattermostReaction {
  user_id: string;
  post_id: string;
  emoji_name: string;
  create_at?: number;
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

export interface MattermostPostSearchResponse {
  posts: MattermostPost[];
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

export function useMattermostPostsInfinite(
  channelId: string | undefined,
  options?: { refetchInterval?: number | false }
) {
  return useInfiniteQuery({
    queryKey: ["mattermost-posts-infinite", channelId],
    enabled: Boolean(channelId),
    refetchInterval: options?.refetchInterval ?? false,
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/mattermost/channels/${channelId}/posts?before=${pageParam}`
        : `/api/mattermost/channels/${channelId}/posts`;

      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to load messages");
      }

      return (await res.json()) as MattermostPostsResponse;
    },
    getNextPageParam: (lastPage) => {
      // Return the oldest post ID if there are more messages
      if (lastPage.hasMore && lastPage.posts.length > 0) {
        return lastPage.posts[0].id;
      }
      return undefined;
    },
    initialPageParam: undefined as string | undefined
  });
}

export function useMattermostPostsAround(
  channelId: string | undefined,
  postId: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["mattermost-posts-around", channelId, postId],
    enabled: enabled && Boolean(channelId) && Boolean(postId),
    staleTime: 60000, // Cache for 1 minute
    retry: 1,
    queryFn: async () => {
      const res = await fetch(
        `/api/mattermost/channels/${channelId}/posts?around=${postId}`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite", channelId] })
      ]);
    }
  });
}

export function useMattermostSendMessage(channelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
        message,
        rootId,
        props
      }: {
        message: string;
        rootId?: string | null;
        props?: MattermostPostProps;
      }) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, rootId, props })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to send message");
      }

      return (await res.json()) as { post: MattermostPost };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite", channelId] })
      ]);
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
  parent_id?: string;
  parent_username?: string;
  parent_message?: string;
  [key: string]: any;
}

export interface MattermostPost {
  id: string;
  user_id: string;
  message: string;
  create_at: number;
  edit_at?: number;
  type?: string;
  root_id?: string | null;
  is_pinned?: boolean;
  metadata?: {
    reactions?: MattermostReaction[];
  };
  props?: MattermostPostProps;
}

export function useMattermostReactToPost(channelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      emoji,
      add
    }: {
      postId: string;
      emoji: string;
      add: boolean;
    }) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/posts/${postId}/reactions`, {
        method: add ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to update reaction");
      }

      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite", channelId] })
      ]);
    }
  });
}

export function useMattermostUpdatePost(channelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, message }: { postId: string; message: string }) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to update message");
      }

      return (await res.json()) as { post: MattermostPost };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite", channelId] })
      ]);
    }
  });
}

export function useMattermostPinnedPosts(channelId: string | undefined) {
  return useQuery({
    queryKey: ["mattermost-pinned-posts", channelId],
    enabled: Boolean(channelId),
    staleTime: 30000, // 30 seconds
    queryFn: async () => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/pinned`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to load pinned messages");
      }
      return (await res.json()) as { posts: MattermostPost[]; users: Record<string, MattermostUser> };
    }
  });
}

export function useMattermostPinPost(channelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/posts/${postId}/pin`, {
        method: "POST"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to pin message");
      }
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mattermost-pinned-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite", channelId] })
      ]);
    }
  });
}

export function useMattermostUnpinPost(channelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/mattermost/channels/${channelId}/posts/${postId}/pin`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to unpin message");
      }
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mattermost-pinned-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts", channelId] }),
        queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite", channelId] })
      ]);
    }
  });
}
