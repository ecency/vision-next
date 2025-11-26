"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useMattermostPosts,
  useMattermostSendMessage,
  MattermostPost,
  MattermostUser,
  useMattermostDeletePost,
  useMattermostDirectChannel,
  useMattermostChannels,
  useMattermostUserSearch,
  useMattermostMarkChannelViewed,
  useMattermostReactToPost,
  useMattermostUpdatePost
} from "./mattermost-api";
import { proxifyImageSrc, setProxyBase } from "@ecency/render-helper";
import { Button } from "@ui/button";
import { FormControl, InputGroup } from "@ui/input";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { blogSvg, deleteForeverSvg, dotsHorizontal, mailSvg } from "@ui/svg";
import { emojiIconSvg } from "@ui/icons";
import { Popover, PopoverContent } from "@ui/popover";
import { ImageUploadButton, UserAvatar } from "@/features/shared";
import { useGlobalStore } from "@/core/global-store";
import { useClientActiveUser } from "@/api/queries";
import defaults from "@/defaults";
import { useRouter, useSearchParams } from "next/navigation";
import { USER_MENTION_PURE_REGEX } from "@/features/tiptap-editor/extensions/user-mention-extension-config";
import clsx from "clsx";
import emojiData from "@emoji-mart/data";
import { SearchIndex, init as initEmojiMart } from "emoji-mart";

const QUICK_REACTIONS = ["👍", "👎", "❤️", "😂", "🎉", "😮", "😢"] as const;
const MATTERMOST_SHORTCODE_REGEX = /:([a-zA-Z0-9_+-]+):/g;
const EMOJI_TRIGGER_REGEX = /:([a-zA-Z0-9_+-]{1,30})$/i;

type EmojiSuggestion = {
  id: string;
  name: string;
  native: string;
};

const SHORTCODE_TO_NATIVE = new Map<string, string>();
const NATIVE_TO_SHORTCODE = new Map<string, string>();

Object.entries(emojiData.emojis).forEach(([id, emoji]) => {
  const primaryId = id.toLowerCase();
  const native = emoji.skins?.[0]?.native;

  emoji.skins?.forEach((skin) => {
    if (!skin?.native) return;

    const shortcodes = Array.isArray(skin.shortcodes)
      ? skin.shortcodes
      : skin.shortcodes
        ? [skin.shortcodes]
        : [];
    const shortcode = (shortcodes[0]?.replace(/^:|:$/g, "") || primaryId).toLowerCase();

    NATIVE_TO_SHORTCODE.set(skin.native, shortcode);
    if (!SHORTCODE_TO_NATIVE.has(shortcode)) {
      SHORTCODE_TO_NATIVE.set(shortcode, skin.native);
    }
  });

  if (native && !SHORTCODE_TO_NATIVE.has(primaryId)) {
    SHORTCODE_TO_NATIVE.set(primaryId, native);
  }

  emoji.aliases?.forEach((alias) => {
    if (native && !SHORTCODE_TO_NATIVE.has(alias.toLowerCase())) {
      SHORTCODE_TO_NATIVE.set(alias.toLowerCase(), native);
    }
  });
});

Object.entries(emojiData.aliases || {}).forEach(([alias, id]) => {
  const native = SHORTCODE_TO_NATIVE.get((id as string).toLowerCase());
  if (native) {
    SHORTCODE_TO_NATIVE.set(alias.toLowerCase(), native);
  }
});

let emojiDataInitPromise: Promise<void> | null = null;
const ensureEmojiDataReady = () => {
  if (!emojiDataInitPromise) {
    emojiDataInitPromise = initEmojiMart({ data: emojiData as unknown });
  }

  return emojiDataInitPromise;
};

function getEmojiShortcodeFromNative(emoji: string) {
  return NATIVE_TO_SHORTCODE.get(emoji);
}

function getNativeEmojiFromShortcode(shortcode: string) {
  return SHORTCODE_TO_NATIVE.get(shortcode.toLowerCase());
}

function toMattermostEmojiName(emoji: string) {
  return getEmojiShortcodeFromNative(emoji) || emoji.replace(/^:|:$/g, "").trim();
}

function normalizeMessageEmojis(message: string) {
  return message.replace(/\p{Extended_Pictographic}+/gu, (emoji) => {
    const emojiName = toMattermostEmojiName(emoji);
    if (!emojiName) return emoji;

    return `:${emojiName}:`;
  });
}

function decodeMessageEmojis(message: string) {
  return message.replace(MATTERMOST_SHORTCODE_REGEX, (_, emojiName) => {
    const native = getNativeEmojiFromShortcode(emojiName);
    return native || `:${emojiName}:`;
  });
}

setProxyBase(defaults.imageServer);

interface Props {
  channelId: string;
}

export function MattermostChannelView({ channelId }: Props) {
  const { data, isLoading, error } = useMattermostPosts(channelId);
  const [message, setMessage] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [emojiQuery, setEmojiQuery] = useState("");
  const [emojiStart, setEmojiStart] = useState<number | null>(null);
  const [emojiSuggestions, setEmojiSuggestions] = useState<EmojiSuggestion[]>([]);
  const [isEmojiSearchLoading, setIsEmojiSearchLoading] = useState(false);
  const sendMutation = useMattermostSendMessage(channelId);
  const deleteMutation = useMattermostDeletePost(channelId);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<MattermostPost | null>(null);
  const [editingPost, setEditingPost] = useState<MattermostPost | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const canUseWebp = useGlobalStore((state) => state.canUseWebp);
  const activeUser = useClientActiveUser();
  const { data: channels } = useMattermostChannels(Boolean(channelId));
  const directChannelMutation = useMattermostDirectChannel();
  const router = useRouter();
  const searchParams = useSearchParams();
  const markViewedMutation = useMattermostMarkChannelViewed();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastViewUpdateRef = useRef(0);
  const [optimisticLastViewedAt, setOptimisticLastViewedAt] = useState<number | null>(null);
  const hasAutoScrolledRef = useRef(false);
  const hasFocusedPostRef = useRef(false);
  const reactMutation = useMattermostReactToPost(channelId);
  const updateMutation = useMattermostUpdatePost(channelId);
  const isSubmitting = sendMutation.isLoading || updateMutation.isPending;
  const [openReactionPostId, setOpenReactionPostId] = useState<string | null>(null);

  const posts = useMemo(() => data?.posts ?? [], [data?.posts]);
  const postsById = useMemo(() => {
    return posts.reduce<Map<string, MattermostPost>>((acc, post) => {
      acc.set(post.id, post);
      return acc;
    }, new Map());
  }, [posts]);
  const focusedPostId = searchParams?.get("post");
  const usersById = useMemo(() => data?.users ?? {}, [data?.users]);
  const usersByUsername = useMemo(() => {
    return Object.values(usersById).reduce<Record<string, MattermostUser>>((acc, user) => {
      if (user.username) {
        acc[user.username.toLowerCase()] = user;
      }
      return acc;
    }, {});
  }, [usersById]);

  const isPublicChannel = data?.channel?.type === "O";
  const mentionSearch = useMattermostUserSearch(mentionQuery, Boolean(isPublicChannel && mentionQuery.length >= 2));
  const effectiveLastViewedAt = optimisticLastViewedAt ?? data?.member?.last_viewed_at ?? 0;
  const firstUnreadIndex = useMemo(() => {
    if (!posts.length) return -1;

    return posts.findIndex((post) => post.create_at > effectiveLastViewedAt);
  }, [effectiveLastViewedAt, posts]);
  const showUnreadDivider = firstUnreadIndex !== -1;

  const markChannelRead = useCallback(() => {
    const id = data?.channel?.id || channelId;
    if (!id) return;

    const now = Date.now();
    if (now - lastViewUpdateRef.current < 4000) return;

    lastViewUpdateRef.current = now;
    setOptimisticLastViewedAt(now);
    markViewedMutation.mutate(id, {
      onError: () => {
        setOptimisticLastViewedAt(data?.member?.last_viewed_at ?? null);
      }
    });
  }, [channelId, data?.channel?.id, data?.member?.last_viewed_at, markViewedMutation]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 120) {
      markChannelRead();
    }
  }, [markChannelRead]);

  useEffect(() => {
    lastViewUpdateRef.current = 0;
    setOptimisticLastViewedAt(null);
    hasAutoScrolledRef.current = false;
    hasFocusedPostRef.current = false;
  }, [channelId]);

  useEffect(() => {
    hasFocusedPostRef.current = false;
  }, [focusedPostId]);

  useEffect(() => {
    if (data) {
      markChannelRead();
    }
  }, [data, markChannelRead]);

  const scrollToPost = useCallback(
    (postId: string, options?: { highlight?: boolean; behavior?: ScrollBehavior }) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const target = container.querySelector<HTMLDivElement>(`[data-post-id="${postId}"]`);
      if (!target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset = targetRect.top - containerRect.top + container.scrollTop - 12;
      const behavior = options?.behavior ?? "smooth";

      container.scrollTo({ top: offset, behavior });

      if (options?.highlight ?? true) {
        target.classList.remove("chat-post-highlight");
        void target.offsetWidth;
        target.classList.add("chat-post-highlight");
      }
    },
    []
  );

  useEffect(() => {
    if (!focusedPostId || !posts.length || hasFocusedPostRef.current) return;

    if (!posts.some((post) => post.id === focusedPostId)) return;

    hasFocusedPostRef.current = true;
    requestAnimationFrame(() => scrollToPost(focusedPostId, { highlight: true, behavior: "smooth" }));
  }, [focusedPostId, posts, scrollToPost]);

  useEffect(() => {
    if (hasFocusedPostRef.current || hasAutoScrolledRef.current) return;
    if (!posts.length) return;

    const targetIndex = firstUnreadIndex !== -1 ? Math.max(0, firstUnreadIndex - 1) : posts.length - 1;
    const targetId = posts[targetIndex]?.id;
    if (!targetId) return;

    hasAutoScrolledRef.current = true;
    requestAnimationFrame(() => scrollToPost(targetId, { highlight: false, behavior: "auto" }));
  }, [firstUnreadIndex, posts, scrollToPost]);

  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }),
    []
  );

  const formatTimestamp = useCallback((value: number) => timestampFormatter.format(new Date(value)), [timestampFormatter]);
  const getUserDisplayName = useCallback((user?: MattermostUser) => {
    if (!user) return undefined;

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    if (fullName) return fullName;

    if (user.nickname) return user.nickname;

    if (user.username) return `@${user.username}`;

    return undefined;
  }, []);

  const directChannelFromList = useMemo(
    () => channels?.channels.find((channel) => channel.id === channelId),
    [channelId, channels?.channels]
  );

  const directChannelUser = useMemo(() => {
    const isDirect = data?.channel?.type === "D" || directChannelFromList?.type === "D";
    if (!isDirect) return null;

    const participantIds = (data?.channel?.name || directChannelFromList?.name || "").split("__");
    const participants = participantIds
      .map((id) => usersById[id])
      .filter(Boolean);

    const participantFromList = directChannelFromList?.directUser;

    return (
      participants.find((user) => user.username !== activeUser?.username) ||
      participantFromList ||
      participants[0] ||
      null
    );
  }, [activeUser?.username, data?.channel?.name, data?.channel?.type, directChannelFromList, usersById]);

  const channelTitle = useMemo(() => {
    if (directChannelUser) {
      const displayName = getUserDisplayName(directChannelUser);
      if (displayName) return displayName;
    }

    return (
      data?.channel?.display_name ||
      directChannelFromList?.display_name ||
      data?.channel?.name ||
      directChannelFromList?.name ||
      "Chat"
    );
  }, [data?.channel?.display_name, data?.channel?.name, directChannelFromList?.display_name, directChannelFromList?.name, directChannelUser, getUserDisplayName]);

  const channelSubtitle = useMemo(() => {
    const isDirectChannel = data?.channel?.type === "D" || directChannelFromList?.type === "D";
    if (isDirectChannel) {
      if (directChannelUser?.username) return `@${directChannelUser.username}`;

      return "Direct message";
    }

    return data?.community ? `${data.community} channel` : "Channel";
  }, [data?.channel?.type, data?.community, directChannelFromList?.type, directChannelUser?.username]);

  useEffect(() => {
    handleScroll();
  }, [posts.length, handleScroll]);

  const getProxiedImageUrl = useCallback(
    (url: string) => {
      const format = canUseWebp ? "webp" : "match";
      return proxifyImageSrc(url, 1024, 0, format) || url;
    },
    [canUseWebp]
  );

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

  const getUsername = (post: MattermostPost) => {
    const user = usersById[post.user_id];

    if (user?.username) return user.username;

    const fallbackUsername =
      (post.props?.username as string | undefined) ||
      (post.props?.override_username as string | undefined) ||
      post.props?.addedUsername;

    if (fallbackUsername) return fallbackUsername.replace(/^@/, "");

    return undefined;
  };

  const getAddedUserDisplayName = (post: MattermostPost) => {
    const addedUserId = post.props?.addedUserId;

    if (addedUserId) {
      const addedUser = usersById[addedUserId];
      if (addedUser) {
        if (addedUser.username) return `@${addedUser.username}`;

        const fullName = [addedUser.first_name, addedUser.last_name].filter(Boolean).join(" ");
        if (fullName) return fullName;

        if (addedUser.nickname) return addedUser.nickname;
      }
    }

    const addedUsername = (post.props?.addedUsername as string | undefined) || undefined;
    if (addedUsername) return addedUsername.startsWith("@") ? addedUsername : `@${addedUsername}`;

    return undefined;
  };

  const getDisplayMessage = (post: MattermostPost) => {
    if (post.type === "system_add_to_channel") {
      const addedUserDisplayName = getAddedUserDisplayName(post);
      if (addedUserDisplayName) {
        return `${addedUserDisplayName} joined`;
      }
    }

    return decodeMessageEmojis(post.message);
  };

  const isImageUrl = (url: string) => {
    const normalizedUrl = url.toLowerCase();
    return (
      /^https?:\/\/images\.ecency\.com\//.test(normalizedUrl) ||
      /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/.test(normalizedUrl)
    );
  };

  const renderMessageContent = (text: string) => {
    const mentionMatcher = new RegExp(USER_MENTION_PURE_REGEX.source, "i");
    const tokens = text.split(/(@(?=[a-zA-Z][a-zA-Z0-9.-]{1,15}\b)[a-zA-Z0-9.-]+|https?:\/\/\S+)/g);

    return tokens
      .filter((token) => token !== "")
      .map((token, idx) => {
        if (/^https?:\/\//.test(token)) {
          if (isImageUrl(token)) {
            const previewUrl = getProxiedImageUrl(token);
            return (
              <a
                key={`${token}-${idx}`}
                href={token}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={previewUrl}
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

        if (mentionMatcher.test(token)) {
          const username = token.slice(1);
          return (
            <MentionToken
              key={`${token}-${idx}`}
              username={username}
              user={usersByUsername[username.toLowerCase()]}
              currentUsername={activeUser?.username}
              onStartDm={startDirectMessage}
            />
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

  const startDirectMessage = (username: string) => {
    directChannelMutation.mutate(username, {
      onSuccess: (result) => {
        router.push(`/chats/${result.channelId}`);
      }
    });
  };

  useEffect(() => {
    ensureEmojiDataReady();
  }, []);

  const updateMentionState = useCallback(
    (value: string, cursor: number) => {
      if (!isPublicChannel) {
        setMentionQuery("");
        setMentionStart(null);
        return;
      }

      const textUntilCursor = value.slice(0, cursor);
      const mentionMatch = textUntilCursor.match(/@([a-zA-Z][a-zA-Z0-9.-]{1,15})$/i);

      if (mentionMatch) {
        setMentionQuery(mentionMatch[1]);
        setMentionStart(textUntilCursor.lastIndexOf("@"));
      } else {
        setMentionQuery("");
        setMentionStart(null);
      }
    },
    [isPublicChannel]
  );

  const updateEmojiState = useCallback((value: string, cursor: number) => {
    const textUntilCursor = value.slice(0, cursor);
    const emojiMatch = textUntilCursor.match(EMOJI_TRIGGER_REGEX);

    if (emojiMatch) {
      setEmojiQuery(emojiMatch[1]);
      setEmojiStart(textUntilCursor.lastIndexOf(":"));
    } else {
      setEmojiQuery("");
      setEmojiStart(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    if (!emojiQuery) {
      setEmojiSuggestions([]);
      setIsEmojiSearchLoading(false);
      return () => {
        active = false;
      };
    }

    setIsEmojiSearchLoading(true);

    ensureEmojiDataReady()
      .then(() => SearchIndex.search(emojiQuery, { maxResults: 15, caller: "chat" }))
      .then((results) => {
        if (!active) return;

        const suggestions = (results || [])
          .map((emoji) => {
            if (!emoji?.id || !emoji?.skins?.[0]?.native) return null;

            return {
              id: emoji.id as string,
              name: (emoji.name as string) || (emoji.id as string),
              native: emoji.skins[0].native as string
            } satisfies EmojiSuggestion;
          })
          .filter(Boolean) as EmojiSuggestion[];

        setEmojiSuggestions(suggestions.slice(0, 8));
      })
      .catch(() => {
        if (active) {
          setEmojiSuggestions([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsEmojiSearchLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [emojiQuery]);

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    const cursor = e.target.selectionStart ?? value.length;
    updateMentionState(value, cursor);
    updateEmojiState(value, cursor);
  };

  const applyEmoji = (shortcode: string) => {
    const textarea = messageInputRef.current;

    setMessage((prev) => {
      if (emojiStart === null) return prev;

      const before = prev.slice(0, emojiStart);
      const afterStart = emojiStart + (emojiQuery?.length || 0) + 1;
      const after = prev.slice(afterStart);
      const insertion = `:${shortcode}:`;
      const spacer = after.startsWith(" ") || after.startsWith("\n") || after === "" ? "" : " ";
      const next = `${before}${insertion}${spacer}${after}`;
      const nextCursor = before.length + insertion.length + spacer.length;

      requestAnimationFrame(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(nextCursor, nextCursor);
        }
      });

      updateMentionState(next, nextCursor);
      updateEmojiState(next, nextCursor);

      return next;
    });

    setEmojiQuery("");
    setEmojiStart(null);
  };

  const applyMention = (username: string) => {
    setMessage((prev) => {
      if (mentionStart === null) return prev;
      const before = prev.slice(0, mentionStart);
      const afterStart = mentionStart + (mentionQuery?.length || 0) + 1;
      const after = prev.slice(afterStart);
      const spacer = after.startsWith(" ") || after.startsWith("\n") || after === "" ? "" : " ";
      return `${before}@${username}${spacer}${after}`;
    });
    setMentionQuery("");
    setMentionStart(null);
    setEmojiQuery("");
    setEmojiStart(null);
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

    const toggleReaction = useCallback(
      (post: MattermostPost, emoji: string, closePicker = false) => {
        const emojiName = toMattermostEmojiName(emoji);

      if (!emojiName || !data?.member?.user_id) return;

      const reactions = post.metadata?.reactions ?? [];
      const hasReacted = reactions.some(
        (reaction) => reaction.emoji_name === emojiName && reaction.user_id === data.member?.user_id
      );

      reactMutation.mutate({ postId: post.id, emoji: emojiName, add: !hasReacted });

      if (closePicker) {
        setOpenReactionPostId((current) => (current === post.id ? null : current));
      }
    },
    [data?.member?.user_id, reactMutation]
  );

  const handleReply = useCallback((post: MattermostPost) => {
    setEditingPost(null);
    setReplyingTo(post);
    requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });
  }, []);

  const handleEdit = useCallback(
    (post: MattermostPost) => {
      setReplyingTo(null);
      setEditingPost(post);
      setMessageError(null);
      const decodedMessage = decodeMessageEmojis(post.message);
      setMessage(decodedMessage);
      const cursor = decodedMessage.length;
      updateMentionState(decodedMessage, cursor);
      updateEmojiState(decodedMessage, cursor);

      requestAnimationFrame(() => {
        const textarea = messageInputRef.current;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(cursor, cursor);
        }
      });
    },
    [updateEmojiState, updateMentionState]
  );

  return (
    <>
      <div className="flex flex-col gap-4 min-h-[70vh] pb-28 md:pb-4">
        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4">
          <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{channelTitle}</div>
            <div className="text-xs text-[--text-muted]">{channelSubtitle}</div>
          </div>
          {effectiveLastViewedAt > 0 && (
            <div
              className="text-[11px] text-[--text-muted]"
              title={new Date(effectiveLastViewedAt).toLocaleString()}
            >
              Last viewed {formatTimestamp(effectiveLastViewedAt)}
            </div>
          )}
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="rounded border border-[--border-color] bg-[--background-color] p-4 pb-[calc(env(safe-area-inset-bottom)+9rem)] md:pb-4 flex-1 min-h-[320px] max-h-[calc(100vh-280px)] overflow-y-auto"
      >
        {isLoading && <div className="text-sm text-[--text-muted]">Loading messages…</div>}
        {error && (
          <div className="text-sm text-red-500">{(error as Error).message || "Failed to load"}</div>
        )}
        {moderationError && <div className="text-sm text-red-500">{moderationError}</div>}
        {!isLoading && !posts.length && (
          <div className="text-sm text-[--text-muted]">No messages yet. Say hello!</div>
        )}
        <div className="space-y-3">
          {posts.map((post, index) => (
            <div key={post.id} className="space-y-3" data-post-id={post.id}>
              {showUnreadDivider && index === firstUnreadIndex && (
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-[--text-muted]">
                  <div className="flex-1 border-t border-[--border-color]" />
                  <span>New</span>
                  <div className="flex-1 border-t border-[--border-color]" />
                </div>
              )}
              <div className="flex gap-3 group relative">
                {post.type === "system_add_to_channel" ? (
                  <div className="w-full flex justify-center">
                    <div className="rounded bg-[--surface-color] px-4 py-2 text-sm text-[--text-muted] text-center">
                      {renderMessageContent(getDisplayMessage(post))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-10 w-10 flex-shrink-0">
                      {(() => {
                        const user = usersById[post.user_id];
                        const displayName = getDisplayName(post);
                        const username = getUsername(post);
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
                        {(() => {
                          const username = getUsername(post);
                          const displayName = getDisplayName(post);

                          if (username) {
                            return (
                              <UsernameActions
                                username={username}
                                displayName={displayName}
                                currentUsername={activeUser?.username}
                                onStartDm={startDirectMessage}
                              />
                            );
                          }

                      return <span>{displayName}</span>;
                        })()}
                        <span className="text-[--text-muted]" title={new Date(post.create_at).toLocaleString()}>
                          {formatTimestamp(post.create_at)}
                        </span>
                        {post.edit_at > post.create_at && (
                          <span
                            className="text-[11px] text-[--text-muted]"
                            title={`Edited ${formatTimestamp(post.edit_at)}`}
                          >
                            • Edited
                          </span>
                        )}
                      </div>
                      {post.root_id && (
                        <button
                          type="button"
                          onClick={() => scrollToPost(post.root_id!)}
                          className="text-left rounded border border-dashed border-[--border-color] bg-[--background-color] p-2 text-xs text-[--text-muted] hover:border-[--text-muted]"
                        >
                          <div className="font-semibold">Replying to {getDisplayName(postsById.get(post.root_id) ?? post)}</div>
                          <div className="line-clamp-2 text-[--text-muted]">
                            {renderMessageContent(getDisplayMessage(postsById.get(post.root_id) ?? post))}
                          </div>
                        </button>
                      )}
                      <div className="rounded bg-[--surface-color] p-3 text-sm whitespace-pre-wrap break-words space-y-2">
                        {renderMessageContent(getDisplayMessage(post))}
                      </div>
                      {(() => {
                        const reactions = post.metadata?.reactions ?? [];
                        if (!reactions.length) return null;

                        const grouped = reactions.reduce<Record<string, { count: number; reacted: boolean }>>(
                          (acc, reaction) => {
                            const existing = acc[reaction.emoji_name] || { count: 0, reacted: false };
                            return {
                              ...acc,
                              [reaction.emoji_name]: {
                                count: existing.count + 1,
                                reacted:
                                  existing.reacted ||
                                  (data?.member?.user_id
                                    ? reaction.user_id === data.member.user_id
                                    : false)
                              }
                            };
                          },
                          {}
                        );

                        return (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(grouped).map(([emojiName, info]) => (
                              <button
                                key={`${post.id}-${emojiName}`}
                                type="button"
                                onClick={() => toggleReaction(post, emojiName)}
                                className={clsx(
                                  "flex items-center gap-1 rounded-full border px-2 py-1 text-xs",
                                  info.reacted
                                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/40"
                                    : "border-[--border-color] bg-[--background-color]"
                                )}
                              >
                                <span>{getNativeEmojiFromShortcode(emojiName) || `:${emojiName}:`}</span>
                                <span className="text-[--text-muted]">{info.count}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
                {post.type !== "system_add_to_channel" && (
                  <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                    <Button
                      appearance="gray-link"
                      size="xs"
                      onClick={() => handleReply(post)}
                      className="!h-7"
                    >
                      Reply
                    </Button>
                    {post.user_id === data?.member?.user_id && (
                      <Button
                        appearance="gray-link"
                        size="xs"
                        onClick={() => handleEdit(post)}
                        className="!h-7"
                      >
                        Edit
                      </Button>
                    )}
                    {(() => {
                      const isReactionPickerOpen = openReactionPostId === post.id;

                      return (
                        <Popover
                          behavior="click"
                          placement="right"
                          customClassName="bg-[--surface-color] border border-[--border-color] rounded-lg shadow-lg"
                          show={isReactionPickerOpen}
                          setShow={(next) => setOpenReactionPostId(next ? post.id : null)}
                          directContent={
                            <Button
                              appearance="gray-link"
                              size="xs"
                              className="!h-7"
                              icon={emojiIconSvg}
                              aria-label="Add reaction"
                              disabled={reactMutation.isPending}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenReactionPostId((current) => (current === post.id ? null : post.id));
                              }}
                            />
                          }
                        >
                          <PopoverContent className="flex max-w-[220px] flex-wrap gap-2 p-3">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={`${post.id}-${emoji}-picker`}
                                type="button"
                                className="rounded-full border border-[--border-color] bg-[--background-color] px-2 py-1 text-lg hover:border-[--text-muted]"
                                onClick={() => toggleReaction(post, emoji, true)}
                                disabled={reactMutation.isPending}
                              >
                                {emoji}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      );
                    })()}
                    {data?.canModerate && (
                      <Dropdown>
                        <DropdownToggle>
                          <Button
                            icon={dotsHorizontal}
                            appearance="gray-link"
                            size="xs"
                            className="h-7 w-7 !p-0"
                            aria-label="Moderation actions"
                          />
                        </DropdownToggle>
                        <DropdownMenu align="right" size="small">
                          <DropdownItemWithIcon
                            icon={deleteForeverSvg}
                            label={deleteMutation.isPending && deletingPostId === post.id ? "Deleting…" : "Delete"}
                            onClick={() => handleDelete(post.id)}
                            disabled={deleteMutation.isPending}
                          />
                        </DropdownMenu>
                      </Dropdown>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-20 flex flex-col gap-3 border-t border-[--border-color] bg-[--surface-color] px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:static md:inset-auto md:bottom-auto md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmedMessage = normalizeMessageEmojis(message.trim());
          if (!trimmedMessage) return;

          setMessageError(null);

          if (editingPost) {
            updateMutation.mutate(
              { postId: editingPost.id, message: trimmedMessage },
              {
                onError: (err) => {
                  setMessageError((err as Error)?.message || "Unable to update message");
                },
                onSuccess: () => {
                  setMessage("");
                  setMentionQuery("");
                  setMentionStart(null);
                  setEmojiQuery("");
                  setEmojiStart(null);
                  setEditingPost(null);
                  requestAnimationFrame(() => {
                    const container = scrollContainerRef.current;
                    if (container) {
                      container.scrollTop = container.scrollHeight;
                    }
                  });
                  markChannelRead();
                }
              }
            );
            return;
          }

          sendMutation.mutate(
            { message: trimmedMessage, rootId: replyingTo?.id ?? null },
            {
              onError: (err) => {
                setMessageError((err as Error)?.message || "Unable to send message");
              },
              onSuccess: () => {
                setMessage("");
                setMentionQuery("");
                setMentionStart(null);
                setEmojiQuery("");
                setEmojiStart(null);
                setReplyingTo(null);
                requestAnimationFrame(() => {
                  const container = scrollContainerRef.current;
                  if (container) {
                    container.scrollTop = container.scrollHeight;
                  }
                });
                markChannelRead();
              }
            }
          );
        }}
      >
        <div className="flex flex-col gap-2 max-w-4xl w-full mx-auto">
          {editingPost && (
            <div className="rounded border border-[--border-color] bg-[--background-color] p-2 text-xs text-[--text-muted]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[--text-color]">Editing message</span>
                <Button
                  type="button"
                  appearance="gray-link"
                  size="xs"
                  onClick={() => {
                    setEditingPost(null);
                    setMessage("");
                    setMentionQuery("");
                    setMentionStart(null);
                    setEmojiQuery("");
                    setEmojiStart(null);
                    setMessageError(null);
                  }}
                  className="!h-6"
                >
                  Cancel
                </Button>
              </div>
              <div className="line-clamp-2 text-[--text-muted]">
                {renderMessageContent(getDisplayMessage(editingPost))}
              </div>
            </div>
          )}
          {replyingTo && (
            <div className="rounded border border-[--border-color] bg-[--background-color] p-2 text-xs text-[--text-muted]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[--text-color]">Replying to {getDisplayName(replyingTo)}</span>
                <Button
                  type="button"
                  appearance="gray-link"
                  size="xs"
                  onClick={() => setReplyingTo(null)}
                  className="!h-6"
                >
                  Cancel
                </Button>
              </div>
              <div className="line-clamp-2 text-[--text-muted]">
                {renderMessageContent(getDisplayMessage(replyingTo))}
              </div>
            </div>
          )}
          {messageError && <div className="text-sm text-red-500">{messageError}</div>}
          <div className="relative">
            {emojiQuery && (
              <div className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded border border-[--border-color] bg-[--surface-color] shadow-lg">
                <div className="px-3 py-2 text-xs text-[--text-muted] flex items-center justify-between">
                  <span>Type :emoji_name to insert an emoji.</span>
                  {isEmojiSearchLoading && <span className="text-[--text-muted]">Searching…</span>}
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {emojiSuggestions.map((emoji) => (
                    <button
                      key={emoji.id}
                      type="button"
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[--background-color]"
                      onClick={() => applyEmoji(emoji.id)}
                    >
                      <span className="text-xl">{emoji.native}</span>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">:{emoji.id}:</span>
                        <span className="text-xs text-[--text-muted]">{emoji.name}</span>
                      </div>
                    </button>
                  ))}
                  {!emojiSuggestions.length && !isEmojiSearchLoading && (
                    <div className="px-3 py-2 text-sm text-[--text-muted]">No emojis found.</div>
                  )}
                </div>
              </div>
            )}
            <InputGroup
              prepend={
                <ImageUploadButton
                  size="md"
                  appearance="gray-link"
                  className="h-full rounded-none"
                  onBegin={() => undefined}
                  onEnd={(url) => setMessage((prev) => (prev ? `${prev}\n${url}` : url))}
                />
              }
              className="items-stretch"
              onClick={() => messageInputRef.current?.focus()}
            >
              <FormControl
                as="textarea"
                ref={messageInputRef}
                rows={2}
                value={message}
                onChange={handleMessageChange}
                placeholder="Write a message"
                className="flex-1 rounded-none"
              />
            </InputGroup>
          </div>
          {isPublicChannel && mentionQuery && (
            <div className="rounded border border-[--border-color] bg-[--surface-color] shadow-sm">
              <div className="px-3 py-2 text-xs text-[--text-muted] flex items-center justify-between">
                <span>Use @ to mention users. Selecting will invite them to this channel.</span>
                {mentionSearch.isFetching && <span className="text-[--text-muted]">Searching…</span>}
              </div>
              <div className="max-h-48 overflow-y-auto">
                {mentionQuery.length < 2 && (
                  <div className="px-3 py-2 text-sm text-[--text-muted]">Keep typing to search for a user.</div>
                )}
                {mentionSearch.data?.users?.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[--background-color]"
                    onClick={() => applyMention(user.username)}
                  >
                    <UserAvatar username={user.username} size="medium" className="h-8 w-8" />
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">@{user.username}</span>
                      {(user.nickname || user.first_name || user.last_name) && (
                        <span className="text-xs text-[--text-muted]">
                          {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.nickname}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {!mentionSearch.isFetching && mentionQuery.length >= 2 && !mentionSearch.data?.users?.length && (
                  <div className="px-3 py-2 text-sm text-[--text-muted]">No users found.</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="w-full max-w-4xl mx-auto flex justify-end">
          <Button type="submit" size="md" disabled={isSubmitting}>
            {editingPost
              ? updateMutation.isPending
                ? "Saving…"
                : "Save"
              : sendMutation.isLoading
                ? "Sending…"
                : "Send"}
          </Button>
        </div>
      </form>
    </div>

      <style jsx global>{`
        @keyframes chat-post-highlight {
          0% {
            background-color: rgba(59, 130, 246, 0.18);
          }
          50% {
            background-color: rgba(59, 130, 246, 0.12);
          }
          100% {
            background-color: transparent;
          }
        }

        [data-post-id].chat-post-highlight {
          animation: chat-post-highlight 1.2s ease-in-out;
          border-radius: 12px;
        }
      `}</style>
    </>
  );
}

function MentionToken({
  username,
  user,
  currentUsername,
  onStartDm
}: {
  username: string;
  user?: MattermostUser;
  currentUsername?: string;
  onStartDm: (username: string) => void;
}) {
  const secondary = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.nickname;
  const isSelf = currentUsername ? username.toLowerCase() === currentUsername.toLowerCase() : false;

  return (
    <Dropdown className="inline-block">
      <DropdownToggle>
        <span
          className={clsx(
            "inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold",
            "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-200"
          )}
          title={secondary || `@${username}`}
        >
          @{username}
        </span>
      </DropdownToggle>
      <DropdownMenu align="left" size="small">
        <DropdownItemWithIcon icon={blogSvg} label="View blog" href={`/@${username}`} />
        {!isSelf && <DropdownItemWithIcon icon={mailSvg} label="Start DM" onClick={() => onStartDm(username)} />}
      </DropdownMenu>
    </Dropdown>
  );
}

function UsernameActions({
  username,
  displayName,
  currentUsername,
  onStartDm
}: {
  username: string;
  displayName: string;
  currentUsername?: string;
  onStartDm: (username: string) => void;
}) {
  const isSelf = currentUsername ? username.toLowerCase() === currentUsername.toLowerCase() : false;

  return (
    <Dropdown className="inline-block">
      <DropdownToggle>
        <span className="cursor-pointer font-semibold hover:text-[--text-color]" title={`@${username}`}>
          {displayName}
        </span>
      </DropdownToggle>
      <DropdownMenu align="left" size="small">
        <DropdownItemWithIcon icon={blogSvg} label="View blog" href={`/@${username}`} />
        {!isSelf && <DropdownItemWithIcon icon={mailSvg} label="Start DM" onClick={() => onStartDm(username)} />}
      </DropdownMenu>
    </Dropdown>
  );
}
