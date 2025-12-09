"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  useMattermostPosts,
  useMattermostPostsInfinite,
  useMattermostSendMessage,
  MattermostPost,
  MattermostUser,
  useMattermostDeletePost,
  useMattermostDirectChannel,
  useMattermostChannels,
  useMattermostUserSearch,
  useMattermostMarkChannelViewed,
  useMattermostReactToPost,
  useMattermostUpdatePost,
  useMattermostAdminBanUser,
  useMattermostAdminDeleteUserPosts
} from "./mattermost-api";
import { useChatAdminStore } from "./chat-admin-store";
import { proxifyImageSrc, setProxyBase } from "@ecency/render-helper";
import { Button } from "@ui/button";
import {
  Dropdown,
  DropdownItemWithIcon,
  DropdownMenu,
  DropdownToggle
} from "@ui/dropdown";
import {
  blogSvg,
  deleteForeverSvg,
  dotsHorizontal,
  mailSvg
} from "@ui/svg";
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
import { EmojiPicker } from "@ui/emoji-picker";
import { GifPicker } from "@ui/gif-picker";
import DOMPurify from "dompurify";
import htmlParse, { domToReact, type HTMLReactParserOptions } from "html-react-parser";
import { Element, Text } from "domhandler";
import { marked } from "marked";

const QUICK_REACTIONS = ["👍", "👎", "❤️", "😂", "🎉", "😮", "😢"] as const;
const MATTERMOST_SHORTCODE_REGEX = /:([a-zA-Z0-9_+-]+):/g;
const EMOJI_TRIGGER_REGEX = /:([a-zA-Z0-9_+-]{1,30})$/i;
const CHANNEL_WIDE_MENTIONS = [
  {
    key: "here",
    label: "@here",
    description: "Notify everyone in this channel unless they have it muted."
  },
  {
    key: "everyone",
    label: "@everyone",
    description: "Notify all channel members unless they muted the channel."
  }
] as const;

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
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useMattermostPostsInfinite(channelId);
  const [message, setMessage] = useState("");
  const hasAppliedSharedText = useRef(false);
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
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<MattermostPost | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const canUseWebp = useGlobalStore((state) => state.canUseWebp);
  const activeUser = useClientActiveUser();
  const isEcencyAdmin = activeUser?.username?.toLowerCase() === "ecency";
  const [adminUsername, setAdminUsername] = useState("");
  const [banHours, setBanHours] = useState("24");
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
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
  const banUserMutation = useMattermostAdminBanUser();
  const deleteUserPostsMutation = useMattermostAdminDeleteUserPosts();
  const isSubmitting = sendMutation.isLoading || updateMutation.isPending;
  const [openReactionPostId, setOpenReactionPostId] = useState<string | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const gifButtonRef = useRef<HTMLButtonElement | null>(null);
  const gifPickerRef = useRef<HTMLDivElement | null>(null);
  const showAdminTools = useChatAdminStore((state) => state.showAdminTools);
  const [expandedJoinGroups, setExpandedJoinGroups] = useState<Set<string>>(new Set());

    type GifStyle = {
      width: string;
      bottom: string;
      left: number;
      marginLeft: string;
      borderTopLeftRadius: string;
      borderTopRightRadius: string;
      borderBottomLeftRadius: string;
    };

    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifPickerStyle, setGifPickerStyle] = useState<GifStyle | undefined>(undefined);

  const posts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .flatMap(page => page.posts)
      .sort((a, b) => Number(a.create_at) - Number(b.create_at));
  }, [data?.pages]);

  // Group consecutive join messages
  type PostItem =
    | { type: 'message'; post: MattermostPost; index: number }
    | { type: 'join-group'; posts: MattermostPost[]; indices: number[]; groupId: string };

  const groupedPosts = useMemo<PostItem[]>(() => {
    const result: PostItem[] = [];
    let currentJoinGroup: MattermostPost[] = [];
    let currentJoinIndices: number[] = [];

    posts.forEach((post, index) => {
      if (post.type === "system_add_to_channel") {
        currentJoinGroup.push(post);
        currentJoinIndices.push(index);
      } else {
        // Flush the current join group if it has 2+ messages
        if (currentJoinGroup.length >= 2) {
          result.push({
            type: 'join-group',
            posts: currentJoinGroup,
            indices: currentJoinIndices,
            groupId: currentJoinGroup[0].id
          });
        } else if (currentJoinGroup.length === 1) {
          // Single join message, add as regular message
          result.push({ type: 'message', post: currentJoinGroup[0], index: currentJoinIndices[0] });
        }
        currentJoinGroup = [];
        currentJoinIndices = [];

        // Add the current non-join message
        result.push({ type: 'message', post, index });
      }
    });

    // Flush remaining join group at the end
    if (currentJoinGroup.length >= 2) {
      result.push({
        type: 'join-group',
        posts: currentJoinGroup,
        indices: currentJoinIndices,
        groupId: currentJoinGroup[0].id
      });
    } else if (currentJoinGroup.length === 1) {
      result.push({ type: 'message', post: currentJoinGroup[0], index: currentJoinIndices[0] });
    }

    return result;
  }, [posts]);

  const normalizeUsername = useCallback((username?: string | null) => {
    if (!username) return username ?? undefined;

    if (username.toLowerCase() === "ecency.") return "ecency";

    return username;
  }, []);

  const usersById = useMemo(() => {
    if (!data?.pages) return {};
    // Merge users from all pages while normalizing special cases
    return data.pages.reduce((acc, page) => {
      Object.entries(page.users).forEach(([id, user]) => {
        const normalizedUser: MattermostUser = {
          ...user,
          username: normalizeUsername(user.username) ?? user.username
        };

        acc[id] = normalizedUser;
      });

      return acc;
    }, {} as Record<string, MattermostUser>);
  }, [data?.pages, normalizeUsername]);

  const channelData = useMemo(() => data?.pages?.[0], [data?.pages]);

  const markdownParser = useMemo(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: false,
      mangle: false
    });

    return (content: string) => (marked.parse(content) as string) || "";
  }, []);
  const postsById = useMemo(() => {
    return posts.reduce<Map<string, MattermostPost>>((acc, post) => {
      acc.set(post.id, post);
      return acc;
    }, new Map());
  }, [posts]);
  const threadRootPost = threadRootId ? postsById.get(threadRootId) ?? null : null;
  const parentPostById = useMemo(() => {
    const parents = new Map<string, MattermostPost>();

    const threads = posts.reduce<Map<string, MattermostPost[]>>((acc, post) => {
      const rootId = post.root_id || post.id;
      const thread = acc.get(rootId) ?? [];
      thread.push(post);
      acc.set(rootId, thread);
      return acc;
    }, new Map());

    threads.forEach((threadPosts) => {
      const ordered = [...threadPosts].sort((a, b) => a.create_at - b.create_at);
      ordered.forEach((post, index) => {
        const parent = ordered[index - 1];
        if (parent) {
          parents.set(post.id, parent);
        }
      });
    });

    return parents;
  }, [posts]);
  const threadPosts = useMemo(() => {
    if (!threadRootId) return [];

    const related = posts.filter(
      (post) => post.id === threadRootId || post.root_id === threadRootId
    );

    return [...related].sort((a, b) => a.create_at - b.create_at);
  }, [posts, threadRootId]);
  const focusedPostId = searchParams?.get("post");

  useEffect(() => {
    if (hasAppliedSharedText.current) {
      return;
    }

    const sharedText = searchParams?.get("text")?.trim();

    if (!sharedText) {
      return;
    }

    setMessage((current) => current || sharedText);
    hasAppliedSharedText.current = true;
  }, [searchParams, setMessage]);
  const usersByUsername = useMemo(() => {
    return Object.values(usersById).reduce<Record<string, MattermostUser>>((acc, user) => {
      if (user.username) {
        acc[user.username.toLowerCase()] = user;
      }
      return acc;
    }, {});
  }, [usersById]);

  const isPublicChannel = channelData?.channel?.type === "O";
  const normalizedMentionQuery = mentionQuery.trim().toLowerCase();
  const channelWideMentionOptions = useMemo(
    () =>
      CHANNEL_WIDE_MENTIONS.filter((mention) =>
        mention.key.startsWith(normalizedMentionQuery)
      ),
    [normalizedMentionQuery]
  );
  const isChannelWideMentionQuery = useMemo(
    () => CHANNEL_WIDE_MENTIONS.some((mention) => mention.key.startsWith(normalizedMentionQuery)),
    [normalizedMentionQuery]
  );
  const mentionSearch = useMattermostUserSearch(
    mentionQuery,
    Boolean(isPublicChannel && mentionQuery.length >= 2)
  );
  const adminUserSearch = useMattermostUserSearch(
    adminUsername,
    Boolean(isEcencyAdmin && adminUsername.trim().length >= 2)
  );
  const effectiveLastViewedAt = optimisticLastViewedAt ?? channelData?.member?.last_viewed_at ?? 0;
  const firstUnreadIndex = useMemo(() => {
    if (!posts.length) return -1;
    return posts.findIndex((post) => post.create_at > effectiveLastViewedAt);
  }, [effectiveLastViewedAt, posts]);
  const showUnreadDivider = firstUnreadIndex !== -1;

  const markChannelRead = useCallback(() => {
    const id = channelData?.channel?.id || channelId;
    if (!id) return;

    const now = Date.now();
    if (now - lastViewUpdateRef.current < 4000) return;

    lastViewUpdateRef.current = now;
    setOptimisticLastViewedAt(now);
    markViewedMutation.mutate(id, {
      onError: () => {
        setOptimisticLastViewedAt(channelData?.member?.last_viewed_at ?? null);
      }
    });
  }, [channelId, channelData?.channel?.id, channelData?.member?.last_viewed_at, markViewedMutation]);

  useEffect(() => {
    if (!showGifPicker) return;

    const handlePointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node | null;

      if (gifPickerRef.current?.contains(targetNode)) return;
      if (gifButtonRef.current?.contains(targetNode as Node)) return;

      setShowGifPicker(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showGifPicker]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 120) {
      markChannelRead();
    }
  }, [markChannelRead]);

  useEffect(() => {
    lastViewUpdateRef.current = 0;
    setOptimisticLastViewedAt(null);
    hasAutoScrolledRef.current = false;
    hasFocusedPostRef.current = false;
    setThreadRootId(null);
    setReplyingTo(null);
    setEditingPost(null);
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

      const target = container.querySelector<HTMLDivElement>(
        `[data-post-id="${postId}"]`
      );
      if (!target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset =
        targetRect.top - containerRect.top + container.scrollTop - 12;
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
    requestAnimationFrame(() =>
      scrollToPost(focusedPostId, { highlight: true, behavior: "smooth" })
    );
  }, [focusedPostId, posts, scrollToPost]);

  useEffect(() => {
    if (hasFocusedPostRef.current || hasAutoScrolledRef.current) return;
    if (!posts.length) return;

    const targetIndex =
      firstUnreadIndex !== -1 ? Math.max(0, firstUnreadIndex - 1) : posts.length - 1;
    const targetId = posts[targetIndex]?.id;
    if (!targetId) return;

    hasAutoScrolledRef.current = true;
    requestAnimationFrame(() =>
      scrollToPost(targetId, { highlight: false, behavior: "auto" })
    );
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

  const formatTimestamp = useCallback(
    (value: number) => timestampFormatter.format(new Date(value)),
    [timestampFormatter]
  );

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

    const participantIds = (data?.channel?.name || directChannelFromList?.name || "").split(
      "__"
    );
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
  }, [
    activeUser?.username,
    channelData?.channel?.name,
    channelData?.channel?.type,
    directChannelFromList,
    usersById
  ]);

  const channelTitle = useMemo(() => {
    if (directChannelUser) {
      const displayName = getUserDisplayName(directChannelUser);
      if (displayName) return displayName;
    }

    return (
      channelData?.channel?.display_name ||
      directChannelFromList?.display_name ||
      channelData?.channel?.name ||
      directChannelFromList?.name ||
      "Chat"
    );
  }, [
    channelData?.channel?.display_name,
    channelData?.channel?.name,
    directChannelFromList?.display_name,
    directChannelFromList?.name,
    directChannelUser,
    getUserDisplayName
  ]);

  const channelSubtitle = useMemo(() => {
    const isDirectChannel =
      channelData?.channel?.type === "D" || directChannelFromList?.type === "D";
    if (isDirectChannel) {
      if (directChannelUser?.username) return `@${directChannelUser.username}`;
      return "Direct message";
    }

    const baseName = channelData?.community ? `${channelData.community} channel` : "Channel";
    const memberCount = channelData?.memberCount;

    if (memberCount !== undefined) {
      return `${baseName} • ${memberCount} member${memberCount === 1 ? "" : "s"}`;
    }

    return baseName;
  }, [
    channelData?.channel?.type,
    channelData?.community,
    channelData?.memberCount,
    directChannelFromList?.type,
    directChannelUser?.username
  ]);

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
      normalizeUsername(post.props?.override_username as string | undefined) ||
      normalizeUsername(post.props?.username) ||
      normalizeUsername(post.props?.addedUsername);
    if (fallbackUsername) return fallbackUsername;

    return post.user_id || "Unknown user";
  };

  const getUsername = (post: MattermostPost) => {
    const user = usersById[post.user_id];

    if (user?.username) return user.username;

    const fallbackUsername =
      normalizeUsername(post.props?.username) ||
      normalizeUsername(post.props?.override_username as string | undefined) ||
      normalizeUsername(post.props?.addedUsername);

    if (fallbackUsername) return fallbackUsername.replace(/^@/, "");

    return undefined;
  };

  const getAddedUserDisplayName = (post: MattermostPost) => {
    const addedUserId = post.props?.addedUserId;

    if (addedUserId) {
      const addedUser = usersById[addedUserId];
      if (addedUser) {
        if (addedUser.username) return `@${addedUser.username}`;

        const fullName = [addedUser.first_name, addedUser.last_name]
          .filter(Boolean)
          .join(" ");
        if (fullName) return fullName;

        if (addedUser.nickname) return addedUser.nickname;
      }
    }

    const addedUsername = (post.props?.addedUsername as string | undefined) || undefined;
    if (addedUsername)
      return addedUsername.startsWith("@") ? addedUsername : `@${addedUsername}`;

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

  const isPartOfEcencyPostLink = (before: string, mention: string, after: string) => {
    const combined = `${before}${mention}${after}`;

    return /https?:\/\/(?:www\.)?ecency\.com\/[^\s]*@(?:[a-zA-Z][a-zA-Z0-9.-]{1,15})/i.test(combined);
  };

  const renderTextWithMentions = (content: string) => {
    const mentionMatcher = new RegExp(USER_MENTION_PURE_REGEX.source, "i");
    const parts = content.split(
      /(@(?=[a-zA-Z][a-zA-Z0-9.-]{1,15}\b)[a-zA-Z0-9.-]+)/
    );

    return parts
      .filter((part) => part !== "")
      .map((part, idx) => {
        if (mentionMatcher.test(part)) {
          const prevPart = parts[idx - 1] || "";
          const nextPart = parts[idx + 1] || "";

          if (isPartOfEcencyPostLink(prevPart, part, nextPart)) {
            return <span key={`${part}-${idx}`}>{part}</span>;
          }

          const username = part.slice(1);
          return (
            <MentionToken
              key={`${part}-${idx}`}
              username={username}
              user={usersByUsername[username.toLowerCase()]}
              currentUsername={activeUser?.username}
              onStartDm={startDirectMessage}
            />
          );
        }

        return <span key={`${part}-${idx}`}>{part}</span>;
      });
  };

  const renderMessageContent = (text: string) => {
    const sanitized = DOMPurify.sanitize(markdownParser(text), {
      ADD_ATTR: ["target", "rel"]
    });

    const parseOptions: HTMLReactParserOptions = {
      replace(domNode) {
        if (domNode.type === "text") {
          return <>{renderTextWithMentions((domNode as Text).data || "")}</>;
        }

        if (domNode instanceof Element) {
          if (domNode.name === "img") {
            const src = domNode.attribs?.src || "";
            const alt = domNode.attribs?.alt || "Shared image";
            const proxied = isImageUrl(src) ? getProxiedImageUrl(src) : src;

            return (
              <img
                src={proxied}
                alt={alt}
                className="max-h-80 rounded border border-[--border-color] object-contain"
              />
            );
          }

          if (domNode.name === "a") {
            const href = domNode.attribs?.href || "";
            const children = domToReact(domNode.children ?? [], parseOptions);
            const containsImage = (domNode.children || []).some(
              (child) => child instanceof Element && child.name === "img"
            );

            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={containsImage ? "block" : "text-blue-500 underline break-all"}
              >
                {children}
              </a>
            );
          }
        }

        return undefined;
      }
    };

    return htmlParse(sanitized, parseOptions);
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

  // auto-resize for textarea
  const autoResize = useCallback(() => {
    const el = messageInputRef.current;
    if (!el) return;

    el.style.height = "0px";
    const scroll = el.scrollHeight;
    const maxHeight = 200;

    el.style.height = Math.min(scroll, maxHeight) + "px";
    el.style.overflowY = scroll > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    ensureEmojiDataReady();
  }, []);

  // auto-resize on message change
  useEffect(() => {
    autoResize();
  }, [message, autoResize]);

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

    autoResize();
  };

  const submitMessage = () => {
    if (isSubmitting) return;

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

    const rootId = replyingTo?.root_id || replyingTo?.id || null;
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("text");
    const nextUrl = params.size ? `/chats/${channelId}?${params.toString()}` : `/chats/${channelId}`;

    sendMutation.mutate(
      { message: trimmedMessage, rootId },
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
          router.replace(nextUrl);
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
  };

  const applyEmoji = (shortcode: string) => {
    const textarea = messageInputRef.current;

    setMessage((prev) => {
      if (emojiStart === null) return prev;

      const before = prev.slice(0, emojiStart);
      const afterStart = emojiStart + (emojiQuery?.length || 0) + 1;
      const after = prev.slice(afterStart);
      const insertion = `:${shortcode}:`;
      const spacer =
        after.startsWith(" ") || after.startsWith("\n") || after === "" ? "" : " ";
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
      const spacer =
        after.startsWith(" ") || after.startsWith("\n") || after === "" ? "" : " ";
      return `${before}@${username}${spacer}${after}`;
    });
    setMentionQuery("");
    setMentionStart(null);
    setEmojiQuery("");
    setEmojiStart(null);
  };

  const handleDelete = (postId: string) => {
    if (!channelData?.canModerate) return;
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

  const handleBanUser = (hoursOverride?: number | null) => {
    if (!isEcencyAdmin) return;

    const normalizedUsername = adminUsername.trim().replace(/^@/, "");
    const hoursValue = hoursOverride ?? Number(banHours);

    if (!normalizedUsername) {
      setAdminError("Enter a username to manage");
      setAdminMessage(null);
      return;
    }

    if (Number.isNaN(hoursValue) || hoursValue < 0) {
      setAdminError("Ban hours must be zero or a positive number");
      setAdminMessage(null);
      return;
    }

    setAdminError(null);
    setAdminMessage(null);

    banUserMutation.mutate(
      { username: normalizedUsername, hours: hoursValue },
      {
        onSuccess: ({ bannedUntil }) => {
          if (hoursValue === 0 || bannedUntil === null) {
            setAdminMessage(`Lifted chat ban for @${normalizedUsername}`);
          } else {
            setAdminMessage(
              `@${normalizedUsername} banned until ${new Date(Number(bannedUntil)).toLocaleString()}`
            );
          }
        },
        onError: (err) => {
          setAdminError((err as Error)?.message || "Unable to update ban");
        }
      }
    );
  };

  const handleDeleteAllPosts = () => {
    if (!isEcencyAdmin) return;

    const normalizedUsername = adminUsername.trim().replace(/^@/, "");
    if (!normalizedUsername) {
      setAdminError("Enter a username to manage");
      setAdminMessage(null);
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete all posts by @${normalizedUsername} across chat channels?`)
    ) {
      return;
    }

    setAdminError(null);
    setAdminMessage(null);

    deleteUserPostsMutation.mutate(normalizedUsername, {
      onSuccess: ({ deleted }) => {
        setAdminMessage(`Deleted ${deleted} post${deleted === 1 ? "" : "s"} from @${normalizedUsername}`);
      },
      onError: (err) => {
        setAdminError((err as Error)?.message || "Unable to delete posts");
      }
    });
  };

  const toggleReaction = useCallback(
    (post: MattermostPost, emoji: string, closePicker = false) => {
      const emojiName = toMattermostEmojiName(emoji);

      if (!emojiName || !channelData?.member?.user_id) return;

      const reactions = post.metadata?.reactions ?? [];
      const hasReacted = reactions.some(
        (reaction) =>
          reaction.emoji_name === emojiName && reaction.user_id === data.member?.user_id
      );

      reactMutation.mutate({
        postId: post.id,
        emoji: emojiName,
        add: !hasReacted
      });

      if (closePicker) {
        setOpenReactionPostId((current) => (current === post.id ? null : current));
      }
    },
    [channelData?.member?.user_id, reactMutation]
  );

  const openThread = useCallback(
    (post: MattermostPost) => {
      const rootId = post.root_id || post.id;
      setThreadRootId(rootId);
      requestAnimationFrame(() =>
        scrollToPost(rootId, { highlight: false, behavior: "auto" })
      );
    },
    [scrollToPost]
  );

  const handleReply = useCallback((post: MattermostPost) => {
    setEditingPost(null);
    setReplyingTo(post);
    openThread(post);
    requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });
  }, [openThread]);

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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 flex-col gap-0 md:pb-0 min-h-0">
        {/* Header with title, subtitle and X on mobile */}
        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left: title + subtitle */}
            <div className="flex flex-col min-w-0">
              <div className="truncate text-lg font-semibold">{channelTitle}</div>
              <div className="truncate text-xs text-[--text-muted]">
                {channelSubtitle}
              </div>
            </div>

            {/* Right side: last viewed + X (mobile only) */}
            <div className="flex items-center gap-3 shrink-0">
              {effectiveLastViewedAt > 0 && (
                <div
                  className="hidden md:block text-[11px] text-[--text-muted]"
                  title={new Date(effectiveLastViewedAt).toLocaleString()}
                >
                  Last viewed {formatTimestamp(effectiveLastViewedAt)}
                </div>
              )}

              {/* X button – visible only on mobile */}
              <button
                type="button"
                onClick={() => router.push("/chats")}
                className="md:hidden text-[--text-muted] hover:text-[--text-color] p-1"
                aria-label="Close chat"
                title="Back to chats"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {isEcencyAdmin && showAdminTools && (
          <div className="mt-3 space-y-3 rounded border border-[--border-color] bg-[--surface-color] p-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">Chat admin tools</div>
                <div className="text-xs text-[--text-muted]">
                  Ban users or delete their posts across channels as @ecency.
                </div>
              </div>
              <div className="flex flex-col gap-1 text-xs md:items-end">
                {adminMessage && <div className="text-green-600">{adminMessage}</div>}
                {adminError && <div className="text-red-500">{adminError}</div>}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex w-full flex-col gap-1 md:w-1/3">
                <label className="text-xs font-semibold text-[--text-muted]" htmlFor="admin-username">
                  Target username
                </label>
                <input
                  id="admin-username"
                  className="w-full rounded-lg border border-[--border-color] bg-white px-3 py-2 text-sm focus:border-blue-dark-sky focus:outline-none"
                  placeholder="exampleuser"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                />
                {adminUserSearch.data?.users?.length ? (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[--text-muted]">
                    <span>Suggestions:</span>
                    {adminUserSearch.data.users.slice(0, 5).map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="rounded-full border border-[--border-color] px-2 py-1 hover:border-blue-dark-sky hover:text-blue-dark-sky"
                        onClick={() => setAdminUsername(user.username || "")}
                      >
                        @{user.username}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-1 md:w-48">
                <label className="text-xs font-semibold text-[--text-muted]" htmlFor="ban-hours">
                  Ban duration (hours)
                </label>
                <input
                  id="ban-hours"
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-[--border-color] bg-white px-3 py-2 text-sm focus:border-blue-dark-sky focus:outline-none"
                  value={banHours}
                  onChange={(e) => setBanHours(e.target.value)}
                />
                <div className="text-[11px] text-[--text-muted]">Use 0 to lift a ban</div>
              </div>

              <div className="flex flex-wrap gap-2 md:ml-auto">
                <Button
                  appearance="primary"
                  onClick={() => handleBanUser()}
                  isLoading={banUserMutation.isPending}
                  disabled={banUserMutation.isPending}
                >
                  Apply ban
                </Button>
                <Button
                  appearance="secondary"
                  outline
                  onClick={() => handleBanUser(0)}
                  isLoading={banUserMutation.isPending}
                  disabled={banUserMutation.isPending}
                >
                  Lift ban
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                appearance="danger"
                onClick={handleDeleteAllPosts}
                isLoading={deleteUserPostsMutation.isPending}
                disabled={deleteUserPostsMutation.isPending}
              >
                Delete all posts by user
              </Button>
              <div className="text-[11px] text-[--text-muted]">
                Removes every chat message from the user across channels.
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row">
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {/* Messages list */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="rounded border border-[--border-color] bg-[--background-color] p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-4 flex-1 min-h-0 md:min-h-[340px] overflow-y-auto"
            >
              {isLoading && (
                <div className="text-sm text-[--text-muted]">Loading messages…</div>
              )}
              {error && (
                <div className="text-sm text-red-500">
                  {(error as Error).message || "Failed to load"}
                </div>
              )}
              {moderationError && (
                <div className="text-sm text-red-500">{moderationError}</div>
              )}
              {!isLoading && !posts.length && (
                <div className="text-sm text-[--text-muted]">
                  No messages yet. Say hello!
                </div>
              )}
              {hasNextPage && (
                <div className="flex justify-center mb-4">
                  <Button
                    appearance="gray-link"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading older messages..." : "Load older messages"}
                  </Button>
                </div>
              )}
              <div className="space-y-3">
                {groupedPosts.map((item) => {
                  if (item.type === 'join-group') {
                    const isExpanded = expandedJoinGroups.has(item.groupId);
                    const firstUnreadInGroup = item.indices.find(i => i === firstUnreadIndex);

                    return (
                      <div key={item.groupId} className="space-y-3">
                        {showUnreadDivider && firstUnreadInGroup !== undefined && (
                          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-[--text-muted]">
                            <div className="flex-1 border-t border-[--border-color]" />
                            <span>New</span>
                            <div className="flex-1 border-t border-[--border-color]" />
                          </div>
                        )}
                        <div className="w-full flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedJoinGroups(prev => {
                                const next = new Set(prev);
                                if (next.has(item.groupId)) {
                                  next.delete(item.groupId);
                                } else {
                                  next.add(item.groupId);
                                }
                                return next;
                              });
                            }}
                            className="rounded bg-[--surface-color] px-4 py-2 text-sm text-[--text-muted] text-center hover:bg-[--hover-color] transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <div className="space-y-1">
                                {item.posts.map(post => (
                                  <div key={post.id}>
                                    {renderMessageContent(getDisplayMessage(post))}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span>{item.posts.length} people joined</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const post = item.post;
                  const index = item.index;

                  return (
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
                                return (
                                  <UserAvatar
                                    username={username}
                                    size="medium"
                                    className="h-10 w-10"
                                  />
                                );
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
                              <span
                                className="text-[--text-muted]"
                                title={new Date(post.create_at).toLocaleString()}
                              >
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
                              (() => {
                                const rootPost = postsById.get(post.root_id!) ?? post;
                                const parentPost = parentPostById.get(post.id);

                                if (!parentPost) return null;

                                return (
                                  <button
                                    type="button"
                                    onClick={() => openThread(rootPost)}
                                    className="text-left rounded border border-dashed border-[--border-color] bg-[--background-color] p-2 text-xs text-[--text-muted] hover:border-[--text-muted]"
                                  >
                                    <div className="font-semibold">
                                      Replying to {getDisplayName(parentPost)}
                                    </div>
                                    <div className="line-clamp-2 text-[--text-muted]">
                                      {renderMessageContent(getDisplayMessage(parentPost))}
                                    </div>
                                  </button>
                                );
                              })()
                            )}
                            <div className="rounded bg-[--surface-color] p-3 text-sm whitespace-pre-wrap break-words space-y-2">
                              {renderMessageContent(getDisplayMessage(post))}
                            </div>
                            {(() => {
                              const reactions = post.metadata?.reactions ?? [];
                              if (!reactions.length) return null;

                              const grouped = reactions.reduce<
                                Record<string, { count: number; reacted: boolean }>
                              >((acc, reaction) => {
                                const existing = acc[reaction.emoji_name] || {
                                  count: 0,
                                  reacted: false
                                };
                                return {
                                  ...acc,
                                  [reaction.emoji_name]: {
                                    count: existing.count + 1,
                                    reacted:
                                      existing.reacted ||
                                      (channelData?.member?.user_id
                                        ? reaction.user_id === channelData.member.user_id
                                        : false)
                                  }
                                };
                              }, {});

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
                                      <span>
                                        {getNativeEmojiFromShortcode(emojiName) ||
                                          `:${emojiName}:`}
                                      </span>
                                      <span className="text-[--text-muted]">
                                        {info.count}
                                      </span>
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
                          {(() => {
                            const isReactionPickerOpen = openReactionPostId === post.id;

                            return (
                              <Popover
                                behavior="click"
                                placement="right"
                                customClassName="bg-[--surface-color] border border-[--border-color] rounded-lg shadow-lg"
                                show={isReactionPickerOpen}
                                setShow={(next) =>
                                  setOpenReactionPostId(next ? post.id : null)
                                }
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
                                      setOpenReactionPostId((current) =>
                                        current === post.id ? null : post.id
                                      );
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
                          <Button
                            appearance="gray-link"
                            size="xs"
                            onClick={() => handleReply(post)}
                            className="!h-7"
                          >
                            Reply
                          </Button>
                          {post.user_id === channelData?.member?.user_id && (
                            <Button
                              appearance="gray-link"
                              size="xs"
                              onClick={() => handleEdit(post)}
                              className="!h-7"
                            >
                              Edit
                            </Button>
                          )}
                          <Dropdown>
                            <DropdownToggle>
                              <Button
                                icon={dotsHorizontal}
                                appearance="gray-link"
                                size="xs"
                                className="h-7 w-7 !p-0"
                                aria-label="Message actions"
                              />
                            </DropdownToggle>
                            <DropdownMenu align="right" size="small">
                              <DropdownItemWithIcon
                                icon={mailSvg}
                                label="Open thread"
                                onClick={() => openThread(post)}
                              />
                              {channelData?.canModerate && (
                                <DropdownItemWithIcon
                                  icon={deleteForeverSvg}
                                  label={
                                    deleteMutation.isPending &&
                                    deletingPostId === post.id
                                      ? "Deleting…"
                                      : "Delete"
                                  }
                                  onClick={() => handleDelete(post.id)}
                                  disabled={deleteMutation.isPending}
                                />
                              )}
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>

          {threadRootId && (
            <div className="hidden lg:flex w-[360px] flex-col rounded border border-[--border-color] bg-[--surface-color] p-4 min-h-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[--text-color]">Thread</span>
                  {threadRootPost && (
                    <span className="text-[11px] text-[--text-muted]">
                      Started by {getDisplayName(threadRootPost)} • {formatTimestamp(threadRootPost.create_at)}
                    </span>
                  )}
                </div>
                <Button
                  appearance="gray-link"
                  size="xs"
                  onClick={() => setThreadRootId(null)}
                  className="!h-7"
                >
                  Close
                </Button>
              </div>

              <div className="mt-3 flex-1 overflow-y-auto space-y-3">
                {threadPosts.length ? (
                  threadPosts.map((post) => (
                    <div
                      key={`${post.id}-thread`}
                      className={clsx(
                        "rounded border border-[--border-color] bg-[--background-color] p-3",
                        post.id === threadRootId &&
                          "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 flex-shrink-0">
                          {(() => {
                            const user = usersById[post.user_id];
                            const displayName = getDisplayName(post);
                            const username = getUsername(post);
                            const avatarUrl = getAvatarUrl(user);

                            if (username) {
                              return (
                                <UserAvatar
                                  username={username}
                                  size="small"
                                  className="h-8 w-8"
                                />
                              );
                            }

                            if (avatarUrl) {
                              return (
                                <img
                                  src={avatarUrl}
                                  alt={`${displayName} avatar`}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              );
                            }

                            return (
                              <div className="h-8 w-8 rounded-full bg-[--surface-color] text-xs font-semibold text-[--text-muted] flex items-center justify-center">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex w-full flex-col gap-2">
                          <div className="flex items-center gap-2 text-[11px] text-[--text-muted]">
                            <span className="font-semibold text-[--text-color]">
                              {getDisplayName(post)}
                            </span>
                            <span title={new Date(post.create_at).toLocaleString()}>
                              {formatTimestamp(post.create_at)}
                            </span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap break-words space-y-2">
                            {renderMessageContent(getDisplayMessage(post))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              appearance="gray-link"
                              size="xs"
                              className="!h-7"
                              onClick={() => scrollToPost(post.id)}
                            >
                              Jump to message
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[--text-muted]">
                    No messages in this thread yet.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Input form */}
      <form
        className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-20 flex flex-col gap-3 border-t border-[--border-color] bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:sticky md:inset-x-0 md:bottom-0 md:border-t md:bg-white md:px-4 md:py-3 md:shadow-[0_-8px_24px_rgba(0,0,0,0.04)]"
        onSubmit={(e) => {
          e.preventDefault();
          submitMessage();
        }}
      >
        <div className="flex flex-col gap-2 max-w-4xl w-full mx-auto">
          {editingPost && (
            <div className="rounded border border-[--border-color] bg-[--background-color] p-2 text-xs text-[--text-muted]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[--text-color]">
                  Editing message
                </span>
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
                <span className="font-semibold text-[--text-color]">
                  Replying to {getDisplayName(replyingTo)}
                </span>
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
          {messageError && (
            <div className="text-sm text-red-500">{messageError}</div>
          )}

          <div className="relative">
            {/* Emoji shortcode suggestions */}
            {emojiQuery && (
              <div className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded border border-[--border-color] bg-[--background-color] shadow-lg">
                <div className="px-3 py-2 text-xs text-[--text-muted] flex items-center justify-between">
                  <span>Type :emoji_name to insert an emoji.</span>
                  {isEmojiSearchLoading && (
                    <span className="text-[--text-muted]">Searching…</span>
                  )}
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
                    <div className="px-3 py-2 text-sm text-[--text-muted]">
                      No emojis found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ChatGPT-style input pill */}
            <div
              className={clsx(
                "flex items-center gap-2", // items-center instead of items-end -> vertical alignment
                "rounded-2xl border border-[--border-color]",
                "bg-[--surface-color] px-3 py-2",
                "shadow-sm",
                "focus-within:ring-2 focus-within:ring-blue-500/60 focus-within:border-blue-500/60",
                "transition-colors"
              )}
              onClick={() => messageInputRef.current?.focus()}
            >
              <div className="flex items-center gap-1">
                <ImageUploadButton
                  size="md"
                  appearance="gray-link"
                  className="rounded-full !px-2 !py-1"
                  onBegin={() => undefined}
                  onEnd={(url) => setMessage((prev) => (prev ? `${prev}\n${url}` : url))}
                  aria-label="Attach image"
                  title="Attach image"
                />
              </div>

              {/* Textarea */}
              <div className="flex-1 min-w-0">
                <textarea
                  ref={messageInputRef}
                  rows={1}
                  value={message}
                  onChange={handleMessageChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();

                      const target = e.currentTarget;
                      const selectionStart = target.selectionStart ?? message.length;
                      const selectionEnd = target.selectionEnd ?? selectionStart;

                      setMessage((prev) => {
                        const nextValue =
                          prev.slice(0, selectionStart) + "\n" + prev.slice(selectionEnd);

                        requestAnimationFrame(() => {
                          target.setSelectionRange(selectionStart + 1, selectionStart + 1);
                        });

                        return nextValue;
                      });

                      return;
                    }

                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                      submitMessage();
                    }
                  }}
                  placeholder="Write a message"
                  className={clsx(
                    "block w-full resize-none bg-transparent",
                    "text-sm md:text-base leading-[1.4]",
                    "py-1.5", // vertical padding to center text visually
                    "outline-none border-none",
                    "placeholder:text-[--text-muted]"
                  )}
                />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  ref={emojiButtonRef}
                  type="button"
                  size="sm"
                  appearance="gray-link"
                  className="rounded-full !px-2 !py-1"
                  icon={emojiIconSvg}
                  aria-label="Add emoji"
                  title="Add emoji"
                />

                <Button
                  ref={gifButtonRef}
                  type="button"
                  size="sm"
                  appearance="gray-link"
                  className="rounded-full !px-2 !py-1 font-semibold"
                  aria-label="Add GIF"
                  title="Add GIF"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (gifButtonRef.current) {
                      const rect = gifButtonRef.current.getBoundingClientRect();

                      const minMargin = 8;
                      const desiredWidth = 430;
                      const pickerWidth = Math.min(
                        desiredWidth,
                        Math.max(260, window.innerWidth - minMargin * 2)
                      );

                      // Distance from button’s bottom to viewport bottom -> picker sits just above the button
                      const bottomPx = window.innerHeight - rect.bottom + minMargin;

                      // Align picker’s right edge with the trigger while clamping on screen
                      const rawLeft = rect.right - pickerWidth;
                      const leftPx = Math.min(
                        Math.max(minMargin, rawLeft),
                        window.innerWidth - pickerWidth - minMargin
                      );

                      setGifPickerStyle({
                        width: `${pickerWidth}px`,
                        bottom: `${bottomPx}px`,
                        left: leftPx,
                        marginLeft: "0",
                        borderTopLeftRadius: "12px",
                        borderTopRightRadius: "12px",
                        borderBottomLeftRadius: "12px"
                      });
                    }

                    setShowGifPicker((prev) => !prev);
                  }}
                >
                  GIF
                </Button>
              </div>
            </div>
          </div>

          {isPublicChannel && mentionQuery && (
            <div
              className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded border border-[--border-color] bg-[--surface-color] shadow-sm"
              style={{ backgroundColor: "var(--surface-color, #fff)" }}
            >
              <div className="px-3 py-2 text-xs text-[--text-muted] flex items-center justify-between">
                <span>
                  Use @ to mention users. Selecting will invite them to this channel.
                </span>
                {mentionSearch.isFetching && (
                  <span className="text-[--text-muted]">Searching…</span>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto">
                {channelData?.canModerate && channelWideMentionOptions.length > 0 && (
                  <>
                    <div className="px-3 pt-2 text-xs font-semibold text-[--text-muted]">
                      Channel-wide mentions
                    </div>
                    {channelWideMentionOptions.map((mention) => (
                      <button
                        key={mention.key}
                        type="button"
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[--background-color]"
                        onClick={() => applyMention(mention.key)}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-semibold">{mention.label}</span>
                          <span className="text-xs text-[--text-muted]">{mention.description}</span>
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-[--border-color]" />
                  </>
                )}
                {!channelData?.canModerate && isChannelWideMentionQuery && (
                  <div className="px-3 py-2 text-xs text-[--text-muted]">
                    Channel-wide mentions (@here, @everyone) are limited to community moderators.
                  </div>
                )}
                {mentionQuery.length < 2 && (
                  <div className="px-3 py-2 text-sm text-[--text-muted]">
                    Keep typing to search for a user.
                  </div>
                )}
                {mentionSearch.data?.users?.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[--background-color]"
                    onClick={() => applyMention(user.username)}
                  >
                    <UserAvatar
                      username={user.username}
                      size="medium"
                      className="h-8 w-8"
                    />
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">@{user.username}</span>
                      {(user.nickname || user.first_name || user.last_name) && (
                        <span className="text-xs text-[--text-muted]">
                          {[user.first_name, user.last_name]
                            .filter(Boolean)
                            .join(" ") || user.nickname}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {!mentionSearch.isFetching &&
                  mentionQuery.length >= 2 &&
                  !mentionSearch.data?.users?.length && (
                    <div className="px-3 py-2 text-sm text-[--text-muted]">
                      No users found.
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </form>
      <EmojiPicker
        anchor={emojiButtonRef.current}
        position="top"
        onSelect={(emoji: string) => {
          setMessage((prev) => prev + emoji);
          // textarea auto-resize will run via useEffect on message
        }}
      />
      {showGifPicker && gifPickerStyle && (
        <GifPicker
          rootRef={gifPickerRef}
          shGif={showGifPicker}
          changeState={(state) => setShowGifPicker(state ?? false)}
          fallback={(gifUrl) => {
            setMessage((prev) => (prev ? `${prev}\n${gifUrl}` : gifUrl));
          }}
          style={gifPickerStyle}
        />
      )}
      {/* highlight animation */}
      <style>{`
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
    </div>
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
  const secondary =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.nickname;
  const isSelf = currentUsername
    ? username.toLowerCase() === currentUsername.toLowerCase()
    : false;

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
        {!isSelf && (
          <DropdownItemWithIcon
            icon={mailSvg}
            label="Start DM"
            onClick={() => onStartDm(username)}
          />
        )}
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
  const isSelf = currentUsername
    ? username.toLowerCase() === currentUsername.toLowerCase()
    : false;

  return (
    <Dropdown className="inline-block">
      <DropdownToggle>
        <span
          className="cursor-pointer font-semibold hover:text-[--text-color]"
          title={`@${username}`}
        >
          {displayName}
        </span>
      </DropdownToggle>
      <DropdownMenu align="left" size="small">
        <DropdownItemWithIcon icon={blogSvg} label="View blog" href={`/@${username}`} />
        {!isSelf && (
          <DropdownItemWithIcon
            icon={mailSvg}
            label="Start DM"
            onClick={() => onStartDm(username)}
          />
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
