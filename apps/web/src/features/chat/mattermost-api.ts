"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientActiveUser } from "@/api/queries";

interface MattermostChannel {
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
      const res = await fetch("/api/mattermost/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: activeUser?.username,
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

      return (await res.json()) as { posts: MattermostPost[] };
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

export interface MattermostPost {
  id: string;
  user_id: string;
  message: string;
  create_at: number;
}
