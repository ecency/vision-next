"use client";

import { useMemo, useState } from "react";
import {
  useMattermostPosts,
  useMattermostSendMessage,
  MattermostPost,
  MattermostUser,
  useMattermostDeletePost
} from "./mattermost-api";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { ImageUploadButton, UserAvatar } from "@/features/shared";

interface Props {
  channelId: string;
}

export function MattermostChannelView({ channelId }: Props) {
  const { data, isLoading, error } = useMattermostPosts(channelId);
  const [message, setMessage] = useState("");
  const sendMutation = useMattermostSendMessage(channelId);
  const deleteMutation = useMattermostDeletePost(channelId);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const posts = useMemo(() => data?.posts ?? [], [data?.posts]);
  const usersById = useMemo(() => data?.users ?? {}, [data?.users]);

  const getDisplayName = (post: MattermostPost) => {
    const user = usersById[post.user_id];

    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
      if (fullName) return fullName;

      if (user.nickname) return user.nickname;

      if (user.username) return `@${user.username}`;
    }

    const fallbackUsername =
      (post.props?.override_username as string | undefined) || post.props?.username || post.props?.addedUsername;
    if (fallbackUsername) return fallbackUsername;

    return post.user_id || "Unknown user";
  };

  const getAddedUserDisplayName = (post: MattermostPost) => {
    const addedUserId = post.props?.addedUserId;

    if (addedUserId) {
      const addedUser = usersById[addedUserId];
      if (addedUser) {
        const fullName = [addedUser.first_name, addedUser.last_name].filter(Boolean).join(" ");
        if (fullName) return fullName;

        if (addedUser.nickname) return addedUser.nickname;

        if (addedUser.username) return `@${addedUser.username}`;
      }
    }

    return (post.props?.addedUsername as string | undefined) || undefined;
  };

  const getDisplayMessage = (post: MattermostPost) => {
    if (post.type === "system_add_to_channel") {
      const addedUserDisplayName = getAddedUserDisplayName(post);
      if (addedUserDisplayName) {
        return `${addedUserDisplayName} joined`;
      }
    }

    return post.message;
  };

  const isImageUrl = (url: string) => {
    const normalizedUrl = url.toLowerCase();
    return (
      /^https?:\/\/images\.ecency\.com\//.test(normalizedUrl) ||
      /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/.test(normalizedUrl)
    );
  };

  const renderMessageContent = (text: string) => {
    const tokens = text.split(/(https?:\/\/\S+)/g);

    return tokens
      .filter((token) => token !== "")
      .map((token, idx) => {
        if (/^https?:\/\//.test(token)) {
          if (isImageUrl(token)) {
            return (
              <a
                key={`${token}-${idx}`}
                href={token}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={token}
                  alt="Shared image"
                  className="max-h-80 rounded border border-[--border-color] object-contain"
                />
              </a>
            );
          }

          return (
            <a
              key={`${token}-${idx}`}
              href={token}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 underline break-all"
            >
              {token}
            </a>
          );
        }

        return <span key={idx}>{token}</span>;
      });
  };

  const getAvatarUrl = (user?: MattermostUser) => {
    if (!user) return undefined;
    const cacheBuster = user.last_picture_update ? `?t=${user.last_picture_update}` : "";
    return `/api/mattermost/users/${user.id}/image${cacheBuster}`;
  };

  const handleDelete = (postId: string) => {
    if (!data?.canModerate) return;
    if (typeof window !== "undefined" && !window.confirm("Delete this message?")) return;

    setModerationError(null);
    setDeletingPostId(postId);
    deleteMutation.mutate(postId, {
      onError: (err) => {
        setModerationError((err as Error)?.message || "Unable to delete message");
        setDeletingPostId(null);
      },
      onSuccess: () => {
        setDeletingPostId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded border border-[--border-color] bg-[--background-color] p-4 h-[60vh] overflow-y-auto">
        {isLoading && <div className="text-sm text-[--text-muted]">Loading messages…</div>}
        {error && (
          <div className="text-sm text-red-500">{(error as Error).message || "Failed to load"}</div>
        )}
        {moderationError && <div className="text-sm text-red-500">{moderationError}</div>}
        {!isLoading && !posts.length && (
          <div className="text-sm text-[--text-muted]">No messages yet. Say hello!</div>
        )}
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="flex gap-3">
              <div className="h-10 w-10 flex-shrink-0">
                {(() => {
                  const user = usersById[post.user_id];
                  const displayName = getDisplayName(post);
                  const username =
                    user?.username ||
                    (post.props?.username as string | undefined) ||
                    (post.props?.override_username as string | undefined);
                  const avatarUrl = getAvatarUrl(user);

                  if (username) {
                    return <UserAvatar username={username} size="medium" className="h-10 w-10" />;
                  }

                  if (avatarUrl) {
                    return (
                      <img
                        src={avatarUrl}
                        alt={`${displayName} avatar`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    );
                  }

                  return (
                    <div className="h-10 w-10 rounded-full bg-[--surface-color] text-sm font-semibold text-[--text-muted] flex items-center justify-center">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center gap-2 text-xs text-[--text-muted]">
                  <span>{getDisplayName(post)}</span>
                  {data?.canModerate && (
                    <Button
                      appearance="danger"
                      outline
                      size="xxs"
                      className="ml-auto"
                      onClick={() => handleDelete(post.id)}
                      isLoading={deleteMutation.isPending && deletingPostId === post.id}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <div className="rounded bg-[--surface-color] p-3 text-sm whitespace-pre-wrap break-words space-y-2">
                  {renderMessageContent(getDisplayMessage(post))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        className="flex gap-2 items-start"
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim()) return;
          sendMutation.mutate(message, {
            onSuccess: () => setMessage("")
          });
        }}
      >
        <ImageUploadButton
          onBegin={() => undefined}
          onEnd={(url) => setMessage((prev) => (prev ? `${prev}\n${url}` : url))}
        />
        <FormControl
          as="textarea"
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message"
          className="flex-1"
        />
        <Button type="submit" disabled={sendMutation.isLoading}>
          {sendMutation.isLoading ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
