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
  useMattermostAdminDeleteUserPosts,
  useMattermostPostsAround,
  useMattermostJoinChannel
} from "./mattermost-api";
import { useChatAdminStore } from "./chat-admin-store";
import {
  ensureEmojiDataReady,
  searchEmojis,
  toMattermostEmojiName,
  getNativeEmojiFromShortcode,
  normalizeMessageEmojis,
  decodeMessageEmojis,
  EMOJI_TRIGGER_REGEX,
  type EmojiSuggestion
} from "./emoji-utils";
import {
  formatTimestamp,
  formatRelativeTime,
  getUserDisplayName,
  getPostDisplayName,
  getPostUsername,
  getAddedUserDisplayName,
  getDisplayMessage,
  getAvatarUrl
} from "./format-utils";
import { saveDraft, loadDraft, clearDraft } from "./draft-utils";
import { ThreadPanel } from "./components/thread-panel";
import { MessageInput } from "./components/message-input";
import { MessageItem } from "./components/message-item";
import { MessageList, type PostItem } from "./components/message-list";
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
import { Modal, ModalBody } from "@ui/modal";
import { ImageUploadButton, ProfileLink, UserAvatar } from "@/features/shared";
import { useGlobalStore } from "@/core/global-store";
import { useClientActiveUser } from "@/api/queries";
import defaults from "@/defaults";
import { useRouter, useSearchParams } from "next/navigation";
import { USER_MENTION_PURE_REGEX } from "@/features/tiptap-editor/extensions/user-mention-extension-config";
import clsx from "clsx";
import { EmojiPicker } from "@ui/emoji-picker";
import { GifPicker } from "@ui/gif-picker";
import DOMPurify from "dompurify";
import htmlParse, { domToReact, type HTMLReactParserOptions } from "html-react-parser";
import { Element, Text } from "domhandler";
import { marked } from "marked";

const QUICK_REACTIONS = ["👍", "👎", "❤️", "😂", "🎉", "😮", "😢"] as const;
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

setProxyBase(defaults.imageServer);

interface Props {
  channelId: string;
}

export function MattermostChannelView({ channelId }: Props) {
  const [isNearBottom, setIsNearBottom] = useState(true);
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useMattermostPostsInfinite(channelId, {
    refetchInterval: isNearBottom ? 60000 : false // Poll every 60 seconds when near bottom
  });
  const searchParams = useSearchParams();
  const shareText = searchParams?.get("text")?.trim();
  const focusedPostId = searchParams?.get("post");
  const [needsAroundFetch, setNeedsAroundFetch] = useState(false);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const aroundQuery = useMattermostPostsAround(
    channelId,
    focusedPostId ?? undefined,
    needsAroundFetch
  );
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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const canUseWebp = useGlobalStore((state) => state.canUseWebp);
  const isMobile = useGlobalStore((state) => state.isMobile);
  const activeUser = useClientActiveUser();
  const isEcencyAdmin = activeUser?.username?.toLowerCase() === "ecency";
  const [adminUsername, setAdminUsername] = useState("");
  const [banHours, setBanHours] = useState("24");
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const { data: channels } = useMattermostChannels(Boolean(channelId));
  const directChannelMutation = useMattermostDirectChannel();
  const joinChannelMutation = useMattermostJoinChannel();
  const router = useRouter();
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
  const isSubmitting = sendMutation.isPending || updateMutation.isPending;
  const [openReactionPostId, setOpenReactionPostId] = useState<string | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const gifButtonRef = useRef<HTMLButtonElement | null>(null);
  const gifPickerRef = useRef<HTMLDivElement | null>(null);
  const showAdminTools = useChatAdminStore((state) => state.showAdminTools);
  const [expandedJoinGroups, setExpandedJoinGroups] = useState<Set<string>>(new Set());
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadCountBelowScroll, setUnreadCountBelowScroll] = useState(0);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

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
    const infinitePosts = data?.pages?.flatMap(page => page.posts) || [];
    const aroundPosts = aroundQuery.data?.posts || [];

    // Merge and deduplicate by post ID
    const postsMap = new Map<string, MattermostPost>();
    [...infinitePosts, ...aroundPosts].forEach(post => {
      postsMap.set(post.id, post);
    });

    return Array.from(postsMap.values())
      .sort((a, b) => Number(a.create_at) - Number(b.create_at));
  }, [data?.pages, aroundQuery.data]);

  // Group consecutive join messages and messages from same user
  const groupedPosts = useMemo<PostItem[]>(() => {
    const result: PostItem[] = [];
    let currentJoinGroup: MattermostPost[] = [];
    let currentJoinIndices: number[] = [];
    const MESSAGE_GROUP_TIME_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds

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
          result.push({ type: 'message', post: currentJoinGroup[0], index: currentJoinIndices[0], isGroupStart: true });
        }
        currentJoinGroup = [];
        currentJoinIndices = [];

        // Determine if this message should be grouped with the previous one
        const lastItem = result[result.length - 1];
        let isGroupStart = true;

        if (
          lastItem &&
          lastItem.type === 'message' &&
          lastItem.post.user_id === post.user_id &&
          lastItem.post.type !== "system_add_to_channel" &&
          post.type !== "system_add_to_channel" &&
          !post.root_id && // Don't group threaded replies
          !lastItem.post.root_id && // Don't group if previous was a threaded reply
          (post.create_at - lastItem.post.create_at) < MESSAGE_GROUP_TIME_WINDOW
        ) {
          isGroupStart = false;
        }

        // Add the current non-join message
        result.push({ type: 'message', post, index, isGroupStart });
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
      result.push({ type: 'message', post: currentJoinGroup[0], index: currentJoinIndices[0], isGroupStart: true });
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
  // ThreadPanel component extracted to components/thread-panel.tsx

  useEffect(() => {
    if (hasAppliedSharedText.current) {
      return;
    }

    if (!shareText) {
      return;
    }

    setMessage((current) => current || shareText);
    hasAppliedSharedText.current = true;
  }, [shareText, setMessage]);
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
    const distanceFromTop = container.scrollTop;

    // Auto-load older messages when scrolled near the top
    if (distanceFromTop < 300 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }

    // Show scroll-to-bottom button if scrolled up more than 200px
    setShowScrollToBottom(distanceFromBottom > 200);

    // Track if user is near bottom for auto-refresh
    setIsNearBottom(distanceFromBottom <= 200);

    // Calculate unread messages when scrolled up
    if (distanceFromBottom > 200 && firstUnreadIndex !== -1) {
      // Count all unread messages (created after last viewed time)
      const unreadCount = posts.filter(
        (post) => post.create_at > effectiveLastViewedAt
      ).length;
      setUnreadCountBelowScroll(unreadCount);
    } else {
      setUnreadCountBelowScroll(0);
    }

    if (distanceFromBottom < 120) {
      markChannelRead();
    }
  }, [markChannelRead, firstUnreadIndex, posts, effectiveLastViewedAt, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    lastViewUpdateRef.current = 0;
    setOptimisticLastViewedAt(null);
    hasAutoScrolledRef.current = false;
    hasFocusedPostRef.current = false;
    setThreadRootId(null);
    setReplyingTo(null);
    setEditingPost(null);
    hasAppliedSharedText.current = false;

    // Load draft message for this channel (if not editing or replying)
    if (!editingPost && !replyingTo) {
      const draft = loadDraft(channelId);
      if (shareText) {
        setMessage(shareText);
        hasAppliedSharedText.current = true;
      } else if (draft) {
        setMessage(draft);
        hasAppliedSharedText.current = true;
      } else {
        setMessage("");
      }
    }

    // Cleanup: clear draft save timeout when changing channels
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [channelId, editingPost, replyingTo, shareText]);

  useEffect(() => {
    hasFocusedPostRef.current = false;
  }, [focusedPostId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape - Cancel edit/reply mode
      if (e.key === "Escape") {
        if (editingPost) {
          setEditingPost(null);
          setMessage("");
          clearDraft(channelId);
          e.preventDefault();
        } else if (replyingTo) {
          setReplyingTo(null);
          e.preventDefault();
        }
      }

      // Ctrl/Cmd+K - Focus on search (will focus channel search in sidebar)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        const searchInput = document.querySelector<HTMLInputElement>('[type="search"]');
        if (searchInput) {
          searchInput.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingPost, replyingTo, channelId]);

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

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });

    // Mark channel as read after scrolling to bottom
    setTimeout(() => {
      markChannelRead();
    }, 500);
  }, [markChannelRead]);

  // Enhanced deep linking with around-based loading
  useEffect(() => {
    if (!focusedPostId || hasFocusedPostRef.current) return;

    // Wait for initial data to load before checking membership
    if (isLoading) return;

    // Check if user is channel member (only after data has loaded)
    const channelData = data?.pages?.[0];
    if (data && focusedPostId && !channelData?.member) {
      setShowJoinPrompt(true);
      return;
    }

    // Check if post is already loaded
    const allPosts = data?.pages?.flatMap(page => page?.posts || []) || [];
    const postInView = allPosts.some(post => post.id === focusedPostId);

    if (postInView) {
      // Post already loaded, scroll to it
      hasFocusedPostRef.current = true;
      requestAnimationFrame(() =>
        scrollToPost(focusedPostId, { highlight: true, behavior: "smooth" })
      );
    } else if (!aroundQuery.data && !aroundQuery.isLoading && !needsAroundFetch) {
      // Post not loaded, trigger around fetch
      setNeedsAroundFetch(true);
    }
  }, [focusedPostId, data, isLoading, aroundQuery.data, aroundQuery.isLoading, needsAroundFetch, scrollToPost]);

  // Handle around query results
  useEffect(() => {
    if (!aroundQuery.data || !focusedPostId) return;

    // Scroll to target post after around data loads
    setTimeout(() => {
      scrollToPost(focusedPostId, { highlight: true, behavior: "smooth" });
      hasFocusedPostRef.current = true;
      setNeedsAroundFetch(false);
    }, 100);
  }, [aroundQuery.data, focusedPostId, scrollToPost]);

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

  // Auto-scroll to bottom when new messages arrive and user is near bottom
  const prevPostsLengthRef = useRef(posts.length);
  useEffect(() => {
    const hasNewMessages = posts.length > prevPostsLengthRef.current;
    prevPostsLengthRef.current = posts.length;

    if (hasNewMessages && isNearBottom && hasAutoScrolledRef.current) {
      // Auto-scroll to show new messages
      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }, [posts.length, isNearBottom]);

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

  // Note: formatTimestamp and formatRelativeTime now imported from format-utils.ts

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
    directChannelUser
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

  const onlineUsers = useMemo(() => {
    const uniqueIds = Array.from(new Set(channelData?.onlineUserIds ?? []));

    const getName = (user: MattermostUser) =>
      getUserDisplayName(user) || user.username || user.id;

    return uniqueIds
      .map((id) => usersById[id])
      .filter((user): user is MattermostUser => Boolean(user))
      .sort((a, b) => getName(a).localeCompare(getName(b)));
  }, [channelData?.onlineUserIds, usersById]);

  const onlineCount = onlineUsers.length;

  useEffect(() => {
    if (onlineCount === 0 && showOnlineUsers) {
      setShowOnlineUsers(false);
    }
  }, [onlineCount, showOnlineUsers]);

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

  // Wrapper functions using extracted utilities with local context
  const getDisplayName = (post: MattermostPost) =>
    getPostDisplayName(post, usersById, normalizeUsername);

  const getUsername = (post: MattermostPost) =>
    getPostUsername(post, usersById, normalizeUsername);

  const getAddedUserName = (post: MattermostPost) =>
    getAddedUserDisplayName(post, usersById);

  // Wrapper to decode emojis in display messages
  const getDecodedDisplayMessage = (post: MattermostPost) => {
    const baseMessage =
      post.type === "system_add_to_channel"
        ? `${getAddedUserDisplayName(post, usersById)} joined the channel`
        : getDisplayMessage(post);

    return decodeMessageEmojis(baseMessage);
  };

  const isImageUrl = (url: string) => {
    const normalizedUrl = url.toLowerCase().trim();
    return (
      /^https?:\/\/images\.ecency\.com\//.test(normalizedUrl) ||
      /\.(png|jpe?g|gif|webp|svg)(\?[^#]*)?(\#.*)?$/i.test(normalizedUrl) ||
      /^https?:\/\/.*\.(gif|giphy)/.test(normalizedUrl) ||
      /tenor\.com\/.*\.gif/.test(normalizedUrl) ||
      /giphy\.com\//.test(normalizedUrl)
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
    try {
      const normalized = text.trimEnd();
      const sanitized = DOMPurify.sanitize(markdownParser(normalized), {
        ADD_ATTR: ["target", "rel"]
      });

      const parseOptions: HTMLReactParserOptions = {
        replace(domNode) {
          if (domNode.type === "text") {
            const textContent = (domNode as Text).data || "";
            // Check if the text is a bare image URL
            const trimmedText = textContent.trim();
            if (isImageUrl(trimmedText) && /^https?:\/\//.test(trimmedText)) {
              const proxied = getProxiedImageUrl(trimmedText);
              return (
                  <img
                    src={proxied}
                    alt="Shared image"
                    className="max-h-80 max-w-full rounded border border-[--border-color] object-contain"
                  />
              );
            }
            return <>{renderTextWithMentions(textContent)}</>;
          }

          if (domNode instanceof Element) {
            if (domNode.name === "p") {
              return <div className="leading-relaxed">{domToReact(domNode.children ?? [], parseOptions)}</div>;
            }

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

              const childText = (domNode.children || [])
                .map((child) => (child.type === "text" ? (child as Text).data?.trim() ?? "" : ""))
                .join("")
                .trim();
              // More lenient check: if the link href is an image and text is similar or empty, render as image
              const isPlainImageLink = !containsImage && isImageUrl(href) && (
                childText === href ||
                childText === href.trim() ||
                !childText ||
                childText === href.replace(/^https?:\/\//, '').trim() ||
                isImageUrl(childText)
              );

              if (isPlainImageLink) {
                const proxied = getProxiedImageUrl(href);

                return (
                  <a href={href} target="_blank" rel="noreferrer" className="inline-block max-w-full">
                    <img
                      src={proxied}
                      alt={childText || "Shared image"}
                      className="max-h-80 max-w-full rounded border border-[--border-color] object-contain"
                    />
                  </a>
                );
              }

              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className={containsImage ? "inline-block" : "text-blue-500 underline break-all"}
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
    } catch (error) {
      console.error("Failed to render chat message", error);
      const fallback = DOMPurify.sanitize(text || "", { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      return <span className="whitespace-pre-wrap break-words">{fallback}</span>;
    }
  };

  // Note: getAvatarUrl now imported from format-utils.ts

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

    searchEmojis(emojiQuery, 15)
      .then((suggestions) => {
        if (!active) return;
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

  // Debounced draft saving
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Save draft with debouncing (500ms delay)
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = setTimeout(() => {
      saveDraft(channelId, value);
    }, 500);

    const cursor = e.target.selectionStart ?? value.length;
    updateMentionState(value, cursor);
    updateEmojiState(value, cursor);

    autoResize();
  };

  // Handle image upload begin
  const handleImageUploadBegin = useCallback(() => {
    setIsUploadingImage(true);
  }, []);

  // Handle image upload complete
  const handleImageUpload = useCallback((url: string) => {
    setUploadedImages((prev) => [...prev, url]);
    setIsUploadingImage(false);
  }, []);

  // Remove uploaded image
  const removeImage = useCallback((index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submitMessage = () => {
    if (isSubmitting) return;

    const trimmedMessage = normalizeMessageEmojis(message.trim());
    const hasImages = uploadedImages.length > 0;

    if (!trimmedMessage && !hasImages) return;

    // Build final message with images
    let finalMessage = trimmedMessage;
    if (hasImages) {
      const imageUrls = uploadedImages.join('\n');
      finalMessage = trimmedMessage ? `${trimmedMessage}\n${imageUrls}` : imageUrls;
    }

    setMessageError(null);

    if (editingPost) {
      updateMutation.mutate(
        { postId: editingPost.id, message: finalMessage },
        {
          onError: (err) => {
            setMessageError((err as Error)?.message || "Unable to update message");
          },
          onSuccess: () => {
            setMessage("");
            setUploadedImages([]); // Clear images
            clearDraft(channelId); // Clear draft after successful edit
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
    const parentProps = replyingTo
      ? {
          parent_id: replyingTo.id,
          parent_username: getUsername(replyingTo),
          parent_message: replyingTo.message
        }
      : undefined;
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("text");
    const nextUrl = params.size ? `/chats/${channelId}?${params.toString()}` : `/chats/${channelId}`;

    sendMutation.mutate(
      { message: trimmedMessage, rootId, props: parentProps },
      {
        onError: (err) => {
          setMessageError((err as Error)?.message || "Unable to send message");
        },
        onSuccess: () => {
          setMessage("");
          setUploadedImages([]); // Clear images
          clearDraft(channelId); // Clear draft after successful send
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
          reaction.emoji_name === emojiName && reaction.user_id === channelData.member?.user_id
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 flex-col gap-0 md:pb-0 min-h-0">
        {/* Header with title, subtitle and X on mobile */}
        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left: title + subtitle */}
            <div className="flex flex-col min-w-0">
              <div className="truncate text-lg font-semibold">{channelTitle}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[--text-muted]">
                <span className="truncate">{channelSubtitle}</span>

                {onlineCount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowOnlineUsers(true)}
                      className="flex items-center gap-1 rounded-full border border-[--border-color] px-2 py-1 text-[11px] text-[--text-muted] transition hover:border-blue-dark-sky hover:text-[--text-color]"
                    >
                      <span className="text-sm leading-none" aria-hidden>
                        🟢
                      </span>
                      <span>{onlineCount} online</span>
                    </button>

                    <Modal
                      show={showOnlineUsers}
                      onHide={() => setShowOnlineUsers(false)}
                      centered
                      size="sm"
                    >
                      <ModalBody>
                        <div className="flex items-center justify-between gap-2 pb-3">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <span className="text-sm leading-none" aria-hidden>
                              🟢
                            </span>
                            <span>Online now</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowOnlineUsers(false)}
                            className="text-[--text-muted] hover:text-[--text-color]"
                            aria-label="Close online users"
                          >
                            ×
                          </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                          {onlineUsers.length ? (
                            <div className="space-y-1">
                              {onlineUsers.map((user) => {
                                const displayName = getUserDisplayName(user) || user.username;

                                if (!user.username) {
                                  return (
                                    <div
                                      key={user.id}
                                      className="flex items-center gap-2 rounded px-2 py-1 hover:bg-[--background-color]"
                                    >
                                      <div className="h-7 w-7 rounded-full bg-[--background-color]" />
                                      <div className="min-w-0">
                                        <div className="truncate text-sm">{displayName}</div>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <ProfileLink
                                    key={user.id}
                                    username={user.username}
                                    afterClick={() => setShowOnlineUsers(false)}
                                    className="flex items-center gap-2 rounded px-2 py-1 hover:bg-[--background-color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-dark-sky"
                                  >
                                    <UserAvatar username={user.username} size="small" />
                                    <div className="min-w-0">
                                      <div className="truncate text-sm">{displayName}</div>
                                      <div className="truncate text-[11px] text-[--text-muted]">@{user.username}</div>
                                    </div>
                                  </ProfileLink>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="px-2 py-1 text-[11px] text-[--text-muted]">
                              No one is online right now.
                            </div>
                          )}
                        </div>
                      </ModalBody>
                    </Modal>
                  </>
                )}
              </div>
            </div>

            {/* Right side: last viewed + keyboard shortcuts + X (mobile only) */}
            <div className="flex items-center gap-3 shrink-0">
              {effectiveLastViewedAt > 0 && (
                <div
                  className="hidden md:block text-[11px] text-[--text-muted]"
                  title={new Date(effectiveLastViewedAt).toLocaleString()}
                >
                  Last viewed {formatTimestamp(effectiveLastViewedAt)}
                </div>
              )}

              {/* Keyboard shortcuts button */}
              <button
                type="button"
                onClick={() => setShowKeyboardShortcuts(true)}
                className="text-[--text-muted] hover:text-[--text-color] p-1 text-sm"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts"
              >
                ⌨️
              </button>

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

        <div className="flex flex-1 min-h-0 flex-col gap-3">
          {/* Messages list */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative rounded border border-[--border-color] bg-[--background-color] p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-4 flex-1 min-h-0 md:min-h-[340px] overflow-y-auto"
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
            {showJoinPrompt && (
              <div className="flex flex-col items-center justify-center p-8 gap-4">
                <p className="text-[--text-muted]">
                  You need to join this channel to view messages
                </p>
                <Button
                  onClick={() => {
                    joinChannelMutation.mutate(channelId, {
                      onSuccess: () => {
                        setShowJoinPrompt(false);
                        setNeedsAroundFetch(true);
                      }
                    });
                  }}
                  isLoading={joinChannelMutation.isPending}
                >
                  Join Channel
                </Button>
              </div>
            )}
            {aroundQuery.isLoading && (
              <div className="flex items-center justify-center p-8 gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                <span className="text-[--text-muted]">Loading message...</span>
              </div>
            )}
            {aroundQuery.isError && (
              <div className="p-4 text-center text-red-500">
                {(aroundQuery.error as Error)?.message || "Unable to load message"}
              </div>
            )}
            {isFetchingNextPage && (
              <div className="flex justify-center mb-4">
                <div className="text-sm text-[--text-muted]">
                  Loading older messages...
                </div>
              </div>
            )}
            {!showJoinPrompt && <MessageList
              groupedPosts={groupedPosts}
              showUnreadDivider={showUnreadDivider}
              firstUnreadIndex={firstUnreadIndex}
              expandedJoinGroups={expandedJoinGroups}
              setExpandedJoinGroups={setExpandedJoinGroups}
              channelId={channelId}
              usersById={usersById}
              channelData={channelData}
              activeUser={activeUser}
              postsById={postsById}
              parentPostById={parentPostById}
              getDisplayName={getDisplayName}
              getUsername={getUsername}
              getDecodedDisplayMessage={getDecodedDisplayMessage}
              renderMessageContent={renderMessageContent}
              normalizeUsername={normalizeUsername}
              startDirectMessage={startDirectMessage}
              openThread={openThread}
              handleReply={handleReply}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              toggleReaction={toggleReaction}
              openReactionPostId={openReactionPostId}
              setOpenReactionPostId={setOpenReactionPostId}
              deletingPostId={deletingPostId}
              reactMutationPending={reactMutation.isPending}
              deleteMutationPending={deleteMutation.isPending}
            />}

            {/* Scroll to bottom button - sticky FAB */}
            {showScrollToBottom && (
              <div className="sticky bottom-4 flex justify-end z-20 pointer-events-none mt-4">
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="pointer-events-auto flex items-center gap-2 rounded-full border border-[--border-color] bg-[--surface-color] px-4 py-2.5 text-sm font-semibold text-[--text-color] shadow-lg shadow-[rgba(0,0,0,0.12)] transition-all hover:bg-[--hover-color] hover:shadow-xl active:scale-95 dark:border-transparent dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600"
                  aria-label="Scroll to bottom"
                >
                  <span className="text-[--text-color] dark:!text-white">↓</span>
                  {unreadCountBelowScroll > 0 ? (
                    <span className="text-[--text-color] dark:!text-white">{unreadCountBelowScroll} new</span>
                  ) : (
                    <span className="sr-only">Jump to latest</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {threadRootId && (
            <Modal
              show={true}
              onHide={() => setThreadRootId(null)}
              centered
            >
              <ModalBody className="!p-0">
                <div className="max-h-[80vh] overflow-y-auto rounded-t-xl bg-[--surface-color]">
                  <ThreadPanel
                    threadRootId={threadRootId}
                    threadRootPost={threadRootPost}
                    threadPosts={threadPosts}
                    usersById={usersById}
                    getDisplayName={getDisplayName}
                    getUsername={getUsername}
                    renderMessageContent={renderMessageContent}
                    getDecodedDisplayMessage={getDecodedDisplayMessage}
                    scrollToPost={scrollToPost}
                    onClose={() => setThreadRootId(null)}
                  />
                </div>
              </ModalBody>
            </Modal>
          )}
        </div>
      </div>

      {/* Input form */}
      <MessageInput
        message={message}
        setMessage={setMessage}
        messageError={messageError}
        setMessageError={setMessageError}
        editingPost={editingPost}
        setEditingPost={setEditingPost}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        uploadedImages={uploadedImages}
        removeImage={removeImage}
        handleImageUploadBegin={handleImageUploadBegin}
        handleImageUpload={handleImageUpload}
        isUploadingImage={isUploadingImage}
        emojiQuery={emojiQuery}
        setEmojiQuery={setEmojiQuery}
        emojiSuggestions={emojiSuggestions}
        isEmojiSearchLoading={isEmojiSearchLoading}
        emojiStart={emojiStart}
        setEmojiStart={setEmojiStart}
        applyEmoji={applyEmoji}
        mentionQuery={mentionQuery}
        setMentionQuery={setMentionQuery}
        mentionStart={mentionStart}
        setMentionStart={setMentionStart}
        mentionSearch={mentionSearch}
        applyMention={applyMention}
        channelWideMentionOptions={channelWideMentionOptions}
        isChannelWideMentionQuery={isChannelWideMentionQuery}
        isPublicChannel={isPublicChannel}
        channelData={channelData}
        handleMessageChange={handleMessageChange}
        isSubmitting={isSubmitting}
        submitMessage={submitMessage}
        handleEdit={handleEdit}
        messageInputRef={messageInputRef}
        emojiButtonRef={emojiButtonRef}
        gifButtonRef={gifButtonRef}
        gifPickerRef={gifPickerRef}
        showGifPicker={showGifPicker}
        setShowGifPicker={setShowGifPicker}
        gifPickerStyle={gifPickerStyle}
        setGifPickerStyle={setGifPickerStyle}
        getDisplayName={getDisplayName}
        getDecodedDisplayMessage={getDecodedDisplayMessage}
        renderMessageContent={renderMessageContent}
        posts={posts}
      />

      {/* Keyboard Shortcuts Modal */}
      <Modal
        show={showKeyboardShortcuts}
        onHide={() => setShowKeyboardShortcuts(false)}
        title="Keyboard Shortcuts"
        centered
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[--text-color]">Message Composition</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="text-[--text-muted]">Send message</span>
                  <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                    Enter
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[--text-muted]">New line</span>
                  <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                    Shift + Enter
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[--text-muted]">New line (alt)</span>
                  <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                    Ctrl/⌘ + Enter
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[--text-muted]">Edit last message</span>
                  <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                    ↑ (when input empty)
                  </kbd>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[--text-color]">Navigation</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="text-[--text-muted]">Focus search</span>
                  <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                    Ctrl/⌘ + K
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[--text-muted]">Cancel edit/reply</span>
                  <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[--text-color]">Formatting</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="text-[--text-muted]">Mention user</span>
                  <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                    @username
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[--text-muted]">Insert emoji</span>
                  <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                    :emoji_name:
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>

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
