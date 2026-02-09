"use client";

import {
  ChangeEvent,
  ReactNode,
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
  useMattermostPostsAround,
  useMattermostJoinChannel,
  useMattermostPinnedPosts,
  useMattermostPinPost,
  useMattermostUnpinPost
} from "./mattermost-api";
import { usePendingPosts } from "./hooks/use-pending-posts";
import { useChannelAdmin } from "./hooks/use-channel-admin";
import { useDmWarning } from "./hooks/use-dm-warning";
import { useDeepLinking } from "./hooks/use-deep-linking";
import { AdminPanel } from "./components/admin-panel";
import { KeyboardShortcutsModal } from "./components/keyboard-shortcuts-modal";
import { MentionToken } from "./components/mention-token";
import { useChatAdminStore } from "./chat-admin-store";
import {
  ensureEmojiDataReady,
  searchEmojis,
  toMattermostEmojiName,
  normalizeMessageEmojis,
  decodeMessageEmojis,
  EMOJI_TRIGGER_REGEX,
  type EmojiSuggestion
} from "./emoji-utils";
import {
  formatTimestamp,
  getUserDisplayName,
  getPostDisplayName,
  getPostUsername,
  getAddedUserDisplayName,
  getDisplayMessage,
} from "./format-utils";
import { saveDraft, loadDraft, clearDraft } from "./draft-utils";
import { ThreadPanel } from "./components/thread-panel";
import { MessageInput } from "./components/message-input";
import { type PostItem } from "./components/message-list";
import { VirtualizedMessageList } from "./components/virtualized-message-list";
import type { VirtuosoHandle } from "react-virtuoso";
import { MattermostWebSocket } from "./mattermost-websocket";
import { DmWarningBanner } from "./components/dm-warning-banner";
import { ChatImage } from "./components/chat-image";
import { proxifyImageSrc, setProxyBase } from "@ecency/render-helper";
import { Button } from "@ui/button";
import { Modal, ModalBody } from "@ui/modal";
import { ProfileLink, UserAvatar } from "@/features/shared";
import { useGlobalStore } from "@/core/global-store";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQueryClient } from "@tanstack/react-query";
import defaults from "@/defaults";
import { useRouter, useSearchParams } from "next/navigation";
import { USER_MENTION_PURE_REGEX } from "@/features/tiptap-editor/extensions/user-mention-extension-config";
import clsx from "clsx";
import DOMPurify from "dompurify";
import htmlParse, { domToReact, type HTMLReactParserOptions } from "html-react-parser";
import { Element, Text } from "domhandler";
import { marked } from "marked";
import {
  HivePostLinkRenderer,
} from "@/features/post-renderer";

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

const ECENCY_HOSTNAMES = new Set([
  "ecency.com",
  "www.ecency.com",
  "peakd.com",
  "www.peakd.com",
  "hive.blog",
  "www.hive.blog"
]);

function isImageUrl(url: string) {
  const normalizedUrl = url.toLowerCase().trim();
  return (
    /^https?:\/\/images\.ecency\.com\//.test(normalizedUrl) ||
    /\.(png|jpe?g|gif|webp|svg)(\?[^#]*)?(\#.*)?$/i.test(normalizedUrl) ||
    /^https?:\/\/.*\.(gif|giphy)/.test(normalizedUrl) ||
    /tenor\.com\/.*\.gif/.test(normalizedUrl) ||
    /giphy\.com\//.test(normalizedUrl)
  );
}

function isPartOfEcencyPostLink(before: string, mention: string, after: string) {
  const combined = `${before}${mention}${after}`;
  return /https?:\/\/(?:www\.)?ecency\.com\/[^\s]*@(?:[a-zA-Z][a-zA-Z0-9.-]{1,15})/i.test(combined);
}

function trimTrailingLinkPunctuation(link: string) {
  let trimmed = link;
  while (trimmed.length && /[\).,!?:]$/.test(trimmed)) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
}

function isEnhanceableEcencyPostLink(href: string) {
  try {
    const url = new URL(href, "https://ecency.com");

    if (url.protocol && url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    if (url.hostname && url.hostname !== "" && !ECENCY_HOSTNAMES.has(url.hostname)) {
      return false;
    }

    if (url.hash.startsWith("#@")) {
      return false;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length < 2) {
      return false;
    }

    const permlink = decodeURIComponent(pathParts.pop() ?? "");
    const author = decodeURIComponent(pathParts.pop() ?? "");

    if (!author.startsWith("@") || !permlink) {
      return false;
    }

    // Allow direct post links (/@author/permlink), community links (/hive-123/@author/permlink),
    // or category links (/category/@author/permlink)
    return pathParts.length <= 1;
  } catch {
    return false;
  }
}

setProxyBase(defaults.imageServer);

interface Props {
  channelId: string;
}

export function MattermostChannelView({ channelId }: Props) {
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isWebSocketActive, setIsWebSocketActive] = useState(true);
  const [reconnectAttempt, setReconnectAttempt] = useState<number | null>(null);
  const [reconnectDelay, setReconnectDelay] = useState<number | null>(null);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useMattermostPostsInfinite(channelId, {
    // Only poll if WebSocket inactive or user scrolled away
    refetchInterval: (!isWebSocketActive || !isNearBottom) ? 60000 : false,
    includeOnline: showOnlineUsers
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

  // Skip query invalidation when WebSocket is active - it handles updates via "posted" event
  const sendMutation = useMattermostSendMessage(channelId, { skipInvalidation: isWebSocketActive });
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
  const { activeUser } = useActiveAccount();
  const isEcencyAdmin = activeUser?.username?.toLowerCase() === "ecency";
  const channelAdmin = useChannelAdmin(isEcencyAdmin);
  const { data: channels } = useMattermostChannels(Boolean(channelId));
  const directChannelMutation = useMattermostDirectChannel();
  const joinChannelMutation = useMattermostJoinChannel();
  const router = useRouter();
  const markViewedMutation = useMattermostMarkChannelViewed();
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const lastViewUpdateRef = useRef(0);
  const [optimisticLastViewedAt, setOptimisticLastViewedAt] = useState<number | null>(null);
  const hasAutoScrolledRef = useRef(false);
  const reactMutation = useMattermostReactToPost(channelId);
  const updateMutation = useMattermostUpdatePost(channelId);
  const pinnedPostsQuery = useMattermostPinnedPosts(channelId);
  const pinPostMutation = useMattermostPinPost(channelId);
  const unpinPostMutation = useMattermostUnpinPost(channelId);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
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
  const websocketRef = useRef<MattermostWebSocket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map());
  const TYPING_TIMEOUT = 5000; // 5 seconds
  const queryClient = useQueryClient();
  const {
    lastSentPendingIdRef,
    lastSentMessageRef,
    lastSentRootIdRef,
    lastSentAtRef,
    confirmedPendingPostIdsRef,
    pendingAbortControllerRef,
    sendMutationRef
  } = usePendingPosts(sendMutation);

    type GifPickerStyle = {
      width: string;
      bottom: string;
      left: string | number;
      marginLeft: string;
      borderTopLeftRadius: string;
      borderTopRightRadius: string;
      borderBottomLeftRadius: string;
    };

    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifPickerStyle, setGifPickerStyle] = useState<GifPickerStyle | null>(null);

  useEffect(() => {
    if (!showOnlineUsers) return;
    queryClient.invalidateQueries({ queryKey: ["mattermost-posts-infinite", channelId] });
  }, [showOnlineUsers, channelId, queryClient]);

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
      breaks: true
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
  const canPin = useMemo(() => {
    const channelType = channelData?.channel?.type;
    const isModerator = channelData?.canModerate;
    const isMember = !!channelData?.member;

    // Public channels (O): only moderators can pin
    if (channelType === "O") {
      return isModerator || false;
    }

    // Direct (D), Group (G), and Private (P): any member can pin
    if (channelType === "D" || channelType === "G" || channelType === "P") {
      return isMember;
    }

    return false;
  }, [channelData?.channel?.type, channelData?.canModerate, channelData?.member]);

  // Compute typing usernames for display
  const typingUsernames = useMemo(() => {
    return Array.from(typingUsers.keys())
      .map(userId => usersById[userId])
      .filter(Boolean)
      .map(user => getUserDisplayName(user) || user.username)
      .slice(0, 3); // Max 3 names shown
  }, [typingUsers, usersById]);

  // Debounced typing sender with auto-reconnect
  const sendTypingDebounced = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const ws = websocketRef.current;
        if (ws) {
          // Attempt to reconnect if disconnected
          if (!isWebSocketActive) ws.connect();
          ws.sendTyping(channelId);
        }
      }, 500);
    };
  }, [channelId, isWebSocketActive]);

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
  const effectiveLastViewedAt = optimisticLastViewedAt ?? channelData?.member?.last_viewed_at ?? 0;
  const firstUnreadIndex = useMemo(() => {
    if (!posts.length) return -1;
    return posts.findIndex((post) => post.create_at > effectiveLastViewedAt);
  }, [effectiveLastViewedAt, posts]);
  const showUnreadDivider = firstUnreadIndex !== -1;

  // Compute initial scroll index for virtualized list (map posts index -> groupedPosts index)
  const initialScrollIndex = useMemo(() => {
    if (firstUnreadIndex === -1) return undefined; // Will default to last item
    const targetPostIndex = Math.max(0, firstUnreadIndex - 1);
    const targetPostId = posts[targetPostIndex]?.id;
    if (!targetPostId) return undefined;
    const groupedIdx = groupedPosts.findIndex((item) =>
      item.type === "message" ? item.post.id === targetPostId :
      item.type === "join-group" ? item.posts.some((p) => p.id === targetPostId) :
      false
    );
    return groupedIdx !== -1 ? groupedIdx : undefined;
  }, [firstUnreadIndex, posts, groupedPosts]);

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

  const onStartReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onAtBottomStateChange = useCallback((atBottom: boolean) => {
    setIsNearBottom(atBottom);
    setShowScrollToBottom(!atBottom);
    if (atBottom) {
      setUnreadCountBelowScroll(0);
      markChannelRead();
    } else if (firstUnreadIndex !== -1) {
      const unreadCount = posts.filter(
        (post) => post.create_at > effectiveLastViewedAt
      ).length;
      setUnreadCountBelowScroll(unreadCount);
    }
  }, [markChannelRead, firstUnreadIndex, posts, effectiveLastViewedAt]);

  useEffect(() => {
    lastViewUpdateRef.current = 0;
    setOptimisticLastViewedAt(null);
    hasAutoScrolledRef.current = false;
    setThreadRootId(null);
    setReplyingTo(null);
    setEditingPost(null);
    hasAppliedSharedText.current = false;

    // Load draft message for this channel
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

    // Cleanup: clear draft save timeout when changing channels
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [channelId, shareText]);

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

  // WebSocket initialization
  useEffect(() => {
    if (!channelId) return;

    try {
      const ws = new MattermostWebSocket()
        .withChannel(channelId)
        .withQueryClient(queryClient)
        .onConnectionChange((active) => {
          setIsWebSocketActive(active);
          // Clear reconnect state when connected
          if (active) {
            setReconnectAttempt(null);
            setReconnectDelay(null);
          }
        })
        .onReconnecting((attempt, delay) => {
          setReconnectAttempt(attempt);
          setReconnectDelay(delay);
        })
        .onTyping((userId) => {
          // Don't show typing indicator for current user
          // Read userId dynamically to avoid recreating WebSocket when channelData changes
          const currentUserId = channelData?.member?.user_id;
          if (userId === currentUserId) return;
          setTypingUsers(prev => new Map(prev).set(userId, Date.now()));
        })
        .onPosted((post) => {
          // Clear input when we get confirmation of our own message via WebSocket
          // Read userId dynamically to avoid recreating WebSocket when channelData changes
          const currentUserId = channelData?.member?.user_id;
          const pendingPostId = post.pending_post_id as string | undefined;
          const pendingMatch =
            pendingPostId &&
            pendingPostId === lastSentPendingIdRef.current;
          const fallbackMatch =
            !pendingPostId &&
            (!currentUserId || post.user_id === currentUserId) &&
            lastSentMessageRef.current !== null &&
            post.message?.replace(/\r\n/g, "\n") ===
              lastSentMessageRef.current.replace(/\r\n/g, "\n") &&
            (post.root_id ?? null) === (lastSentRootIdRef.current ?? null) &&
            Math.abs(post.create_at - lastSentAtRef.current) < 30000;

          if (pendingMatch || fallbackMatch) {
            const confirmedId = lastSentPendingIdRef.current;
            if (confirmedId) {
              confirmedPendingPostIdsRef.current.add(confirmedId);
            }
            setMessage("");
            setUploadedImages([]);
            clearDraft(channelId);
            setMentionQuery("");
            setMentionStart(null);
            setEmojiQuery("");
            setEmojiStart(null);
            setReplyingTo(null);
            setMessageError(null);
            lastSentPendingIdRef.current = null;
            lastSentMessageRef.current = null;
            lastSentRootIdRef.current = null;
            lastSentAtRef.current = 0;
            if (pendingAbortControllerRef.current) {
              pendingAbortControllerRef.current.abort();
              pendingAbortControllerRef.current = null;
            }
            sendMutationRef.current.reset();
            // Refocus input after sending
            requestAnimationFrame(() => {
              messageInputRef.current?.focus();
            });
          }
        });

      websocketRef.current = ws;
      ws.connect();
    } catch (error) {
      console.error("Failed to initialize chat WebSocket:", error);
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.disconnect();
        websocketRef.current = null;
      }
    };
  }, [channelId, queryClient]);

  // Typing indicators auto-cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const now = Date.now();
        const updated = new Map(prev);
        let changed = false;

        updated.forEach((timestamp, userId) => {
          if (now - timestamp > TYPING_TIMEOUT) {
            updated.delete(userId);
            changed = true;
          }
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [TYPING_TIMEOUT]);

  const scrollToPost = useCallback(
    (postId: string, options?: { highlight?: boolean; behavior?: ScrollBehavior }) => {
      // Find the index in groupedPosts
      const idx = groupedPosts.findIndex((item) =>
        item.type === "message" ? item.post.id === postId :
        item.type === "join-group" ? item.posts.some((p) => p.id === postId) :
        false
      );
      if (idx === -1) return;

      const behavior = options?.behavior === "auto" ? "auto" : "smooth";
      virtuosoRef.current?.scrollToIndex({
        index: idx,
        align: "center",
        behavior: behavior as "auto" | "smooth"
      });

      if (options?.highlight ?? true) {
        setTimeout(() => {
          const target = document.querySelector<HTMLDivElement>(
            `[data-post-id="${postId}"]`
          );
          if (target) {
            target.classList.remove("chat-post-highlight");
            void target.offsetWidth;
            target.classList.add("chat-post-highlight");
          }
        }, 100);
      }
    },
    [groupedPosts]
  );

  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: "LAST",
      behavior: "smooth"
    });

    // Mark channel as read after scrolling to bottom
    setTimeout(() => {
      markChannelRead();
    }, 500);
  }, [markChannelRead]);

  // Deep linking: scroll to focused post, fetch around if needed, handle join prompts
  useDeepLinking({
    channelId,
    focusedPostId: focusedPostId ?? null,
    data,
    isLoading,
    aroundQuery,
    scrollToPost,
    setNeedsAroundFetch,
    setShowJoinPrompt
  });

  // Initial scroll handled by Virtuoso's initialTopMostItemIndex
  useEffect(() => {
    if (posts.length && !hasAutoScrolledRef.current) {
      hasAutoScrolledRef.current = true;
    }
  }, [posts.length]);

  // Auto-scroll handled by Virtuoso's followOutput

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
    const isDirect = channelData?.channel?.type === "D" || directChannelFromList?.type === "D";
    if (!isDirect) return null;

    const participantIds = (channelData?.channel?.name || directChannelFromList?.name || "").split(
      "__"
    );
    const participants = participantIds
      .map((id: string) => usersById[id])
      .filter((u): u is MattermostUser => Boolean(u));

    const participantFromList = directChannelFromList?.directUser;

    return (
      participants.find((user: MattermostUser) => user.username !== activeUser?.username) ||
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

  const { showDmWarning, handleDismissDmWarning } = useDmWarning({
    channelId,
    channelData,
    posts,
    hasNextPage: hasNextPage ?? false,
    sendMutationSuccess: sendMutation.isSuccess
  });

  const getProxiedImageUrl = useCallback(
    (url: string) => {
      const format = canUseWebp ? "webp" : "match";
      return proxifyImageSrc(url, 1024, 0, format) || url;
    },
    [canUseWebp]
  );

  // Wrapper functions using extracted utilities with local context
  const getDisplayName = useCallback(
    (post: MattermostPost) => getPostDisplayName(post, usersById, normalizeUsername),
    [usersById, normalizeUsername]
  );

  const getUsername = useCallback(
    (post: MattermostPost) => getPostUsername(post, usersById, normalizeUsername),
    [usersById, normalizeUsername]
  );

  // Wrapper to decode emojis in display messages
  const getDecodedDisplayMessage = useCallback(
    (post: MattermostPost) => {
      const baseMessage =
        post.type === "system_add_to_channel"
          ? `${getAddedUserDisplayName(post, usersById)} joined the channel`
          : getDisplayMessage(post);

      return decodeMessageEmojis(baseMessage);
    },
    [usersById]
  );


  const startDirectMessage = useCallback(
    (username: string) => {
      directChannelMutation.mutate(username, {
        onSuccess: (result) => {
          router.push(`/chats/${result.channelId}`);
        }
      });
    },
    [directChannelMutation, router]
  );

  const ECENCY_POST_LINK_REGEX = useMemo(
    () => /https?:\/\/(?:www\.)?(?:ecency\.com|peakd\.com|hive\.blog)\/[^\s]*@(?:[a-zA-Z][a-zA-Z0-9.-]{1,15})\/[^\s)]+/gi,
    []
  );

  const renderMessageContent = useMemo(() => {
    const renderTextWithMentions = (content: string, keyPrefix = "mention") => {
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
              return <span key={`${keyPrefix}-${part}-${idx}`}>{part}</span>;
            }

            const username = part.slice(1);
            return (
              <MentionToken
                key={`${keyPrefix}-${part}-${idx}`}
                username={username}
                user={usersByUsername[username.toLowerCase()]}
                currentUsername={activeUser?.username}
                onStartDm={startDirectMessage}
              />
            );
          }

          return <span key={`${keyPrefix}-${part}-${idx}`}>{part}</span>;
        });
    };

    const renderTextWithEnhancements = (content: string) => {
      const matches = Array.from(content.matchAll(ECENCY_POST_LINK_REGEX));

      if (!matches.length) {
        return renderTextWithMentions(content);
      }

      const nodes: ReactNode[] = [];
      let cursor = 0;

      matches.forEach((match, index) => {
        const matchIndex = match.index ?? 0;
        const matchedText = match[0];

        if (matchIndex > cursor) {
          nodes.push(...renderTextWithMentions(content.slice(cursor, matchIndex), `mention-${index}-before`));
        }

        const cleanedLink = trimTrailingLinkPunctuation(matchedText);
        const trailing = matchedText.slice(cleanedLink.length);

        if (isEnhanceableEcencyPostLink(cleanedLink)) {
          const linkHash = cleanedLink.split('/').pop() || index;
          nodes.push(<HivePostLinkRenderer key={`ecency-link-${index}-${linkHash}`} link={cleanedLink} />);
        } else {
          nodes.push(...renderTextWithMentions(cleanedLink, `mention-${index}-link`));
        }

        if (trailing) {
          nodes.push(...renderTextWithMentions(trailing, `mention-${index}-trail`));
        }

        cursor = matchIndex + matchedText.length;
      });

      if (cursor < content.length) {
        nodes.push(...renderTextWithMentions(content.slice(cursor), "mention-tail"));
      }

      return nodes;
    };

    return (text: string) => {
      try {
        const normalized = text.trimEnd();
        const sanitized = DOMPurify.sanitize(markdownParser(normalized), {
          ADD_ATTR: ["target", "rel"]
        });

        const createParseOptions = (inLink = false): HTMLReactParserOptions => ({
          replace(domNode) {
            if (domNode.type === "text") {
              const textContent = (domNode as Text).data || "";
              const trimmedText = textContent.trim();
              if (isImageUrl(trimmedText) && /^https?:\/\//.test(trimmedText)) {
                const proxied = getProxiedImageUrl(trimmedText);
                return (
                  <ChatImage
                    src={proxied}
                    alt="Shared image"
                  />
                );
              }
              return <>{inLink ? renderTextWithMentions(textContent) : renderTextWithEnhancements(textContent)}</>;
            }

            if (domNode instanceof Element) {
              if (domNode.name === "p") {
                return (
                  <div className="leading-relaxed">
                    {domToReact((domNode.children ?? []) as any, createParseOptions(inLink))}
                  </div>
                );
              }

              if (domNode.name === "img") {
                const src = domNode.attribs?.src || "";
                const alt = domNode.attribs?.alt || "Shared image";
                const proxied = isImageUrl(src) ? getProxiedImageUrl(src) : src;

                return (
                  <ChatImage
                    src={proxied}
                    alt={alt}
                  />
                );
              }

              if (domNode.name === "a") {
                const href = domNode.attribs?.href || "";
                const children = domToReact((domNode.children ?? []) as any, createParseOptions(true));
                const containsImage = (domNode.children || []).some(
                  (child) => child instanceof Element && child.name === "img"
                );

                const isEcencyPostLink = isEnhanceableEcencyPostLink(href);

                const childText = (domNode.children || [])
                  .map((child) => (child.type === "text" ? (child as Text).data?.trim() ?? "" : ""))
                  .join("")
                  .trim();
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
                    <ChatImage
                      src={proxied}
                      alt={childText || "Shared image"}
                    />
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
        });

        return htmlParse(sanitized, createParseOptions());
      } catch (error) {
        console.error("Failed to render chat message", error);
        const fallback = DOMPurify.sanitize(text || "", { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        return <span className="whitespace-pre-wrap break-words">{fallback}</span>;
      }
    };
  }, [markdownParser, getProxiedImageUrl, usersByUsername, activeUser?.username, startDirectMessage, ECENCY_POST_LINK_REGEX]);

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

    // Send typing indicator via WebSocket
    if (value.length > 0) {
      sendTypingDebounced();
    }

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
              virtuosoRef.current?.scrollToIndex({ index: "LAST", behavior: "smooth" });
              // Refocus input after editing
              messageInputRef.current?.focus();
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

    // Generate unique pending_post_id for idempotency across load-balanced instances
    const pendingPostId = `${channelData?.member?.user_id || 'user'}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Store pending ID for WebSocket confirmation
    lastSentPendingIdRef.current = pendingPostId;
    lastSentMessageRef.current = finalMessage;
    lastSentRootIdRef.current = rootId;
    lastSentAtRef.current = Date.now();
    pendingAbortControllerRef.current = new AbortController();

    sendMutation.mutate(
      { message: finalMessage, rootId, props: parentProps, pendingPostId, signal: pendingAbortControllerRef.current.signal },
      {
        onError: (err, variables) => {
          if (pendingAbortControllerRef.current) {
            pendingAbortControllerRef.current = null;
          }
          const pendingId = variables?.pendingPostId;
          if (pendingId && confirmedPendingPostIdsRef.current.has(pendingId)) {
            confirmedPendingPostIdsRef.current.delete(pendingId);
            sendMutationRef.current.reset();
            return;
          }
          if ((err as Error)?.name === "AbortError") {
            return;
          }
          setMessageError((err as Error)?.message || "Unable to send message");
          lastSentPendingIdRef.current = null; // Clear on error
        },
        onSuccess: (_data, variables) => {
          if (pendingAbortControllerRef.current) {
            pendingAbortControllerRef.current = null;
          }
          const pendingId = variables?.pendingPostId;
          // Only clear input via HTTP if WebSocket is NOT connected
          // WebSocket will handle it via onPosted callback for instant feedback
          if (!isWebSocketActive || (pendingId && lastSentPendingIdRef.current === pendingId)) {
            setMessage("");
            setUploadedImages([]); // Clear images
            clearDraft(channelId); // Clear draft after successful send
            setMentionQuery("");
            setMentionStart(null);
            setEmojiQuery("");
            setEmojiStart(null);
            setReplyingTo(null);
            lastSentPendingIdRef.current = null;
            lastSentMessageRef.current = null;
            lastSentRootIdRef.current = null;
            lastSentAtRef.current = 0;
            confirmedPendingPostIdsRef.current.delete(pendingId ?? "");
            requestAnimationFrame(() => {
              messageInputRef.current?.focus();
            });
          }
          router.replace(nextUrl);
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

  const handleDelete = useCallback(
    (post: MattermostPost) => {
      const currentUserId = channelData?.member?.user_id;
      const canDelete = channelData?.canModerate || (currentUserId && post.user_id === currentUserId);
      if (!canDelete) return;
      if (typeof window !== "undefined" && !window.confirm("Delete this message?")) return;

      setModerationError(null);
      setDeletingPostId(post.id);
      deleteMutation.mutate(post.id, {
        onError: (err) => {
          setModerationError((err as Error)?.message || "Unable to delete message");
          setDeletingPostId(null);
        },
        onSuccess: () => {
          setDeletingPostId(null);
        }
      });
    },
    [channelData?.member?.user_id, channelData?.canModerate, deleteMutation]
  );

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

  const handlePinToggle = useCallback((postId: string, isPinned: boolean) => {
    if (!canPin) return;

    // Check 5-pin limit before pinning
    if (!isPinned && (pinnedPostsQuery.data?.posts.length ?? 0) >= 5) {
      setMessageError("Cannot pin more than 5 messages per channel");
      return;
    }

    const mutation = isPinned ? unpinPostMutation : pinPostMutation;
    mutation.mutate(postId, {
      onError: (err) => {
        setMessageError((err as Error)?.message || "Unable to update pin");
      }
    });
  }, [canPin, pinnedPostsQuery.data?.posts.length, pinPostMutation, unpinPostMutation]);

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

                {pinnedPostsQuery.data?.posts && pinnedPostsQuery.data.posts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPinnedModal(true)}
                    className="flex items-center gap-1 rounded-full border border-[--border-color] px-2 py-1 text-[11px] text-[--text-muted] transition hover:border-blue-dark-sky hover:text-[--text-color]"
                  >
                    <span className="text-sm leading-none" aria-hidden>
                      📌
                    </span>
                    <span>{pinnedPostsQuery.data.posts.length} pinned</span>
                  </button>
                )}

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

            {/* Pinned Messages Modal */}
            <Modal
              show={showPinnedModal}
              onHide={() => setShowPinnedModal(false)}
              centered
              size="sm"
            >
              <ModalBody>
                <div className="flex items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-sm leading-none" aria-hidden>
                      📌
                    </span>
                    <span>Pinned Messages</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPinnedModal(false)}
                    className="text-[--text-muted] hover:text-[--text-color]"
                    aria-label="Close pinned messages"
                  >
                    ×
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {pinnedPostsQuery.data?.posts && pinnedPostsQuery.data.posts.length > 0 ? (
                    <div className="space-y-2">
                      {pinnedPostsQuery.data.posts.map((post) => {
                        const author = usersById[post.user_id];
                        const displayName = author ? (getUserDisplayName(author) || author.username) : 'Unknown';
                        const message = getDecodedDisplayMessage(post);

                        return (
                          <div
                            key={post.id}
                            className="group rounded border border-[--border-color] bg-[--background-color] p-2 hover:border-blue-dark-sky cursor-pointer transition"
                            onClick={() => {
                              scrollToPost(post.id);
                              setShowPinnedModal(false);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-xs text-[--text-muted] mb-1">
                                  <span className="font-semibold text-[--text-color]">{displayName}</span>
                                  <span>•</span>
                                  <span>{formatTimestamp(post.create_at)}</span>
                                </div>
                                <div className="text-sm line-clamp-3 break-words">
                                  {message}
                                </div>
                              </div>
                              {canPin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePinToggle(post.id, true);
                                  }}
                                  disabled={unpinPostMutation.isPending}
                                  className="opacity-0 group-hover:opacity-100 text-[--text-muted] hover:text-red-500 p-1 transition"
                                  aria-label="Unpin message"
                                  title="Unpin message"
                                >
                                  {unpinPostMutation.isPending ? '⏳' : '📌'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-2 py-4 text-center text-[11px] text-[--text-muted]">
                      No pinned messages
                    </div>
                  )}
                </div>
              </ModalBody>
            </Modal>

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

        {/* DM safety warning */}
        {showDmWarning && (
          <DmWarningBanner
            onDismiss={handleDismissDmWarning}
            settingsHref={activeUser?.username ? `/@${activeUser.username}/settings` : undefined}
          />
        )}

        {/* Reconnection status banner */}
        {reconnectAttempt !== null && reconnectDelay !== null && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg leading-none" aria-hidden>⚠️</span>
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Reconnecting to chat (attempt {reconnectAttempt} in {Math.round(reconnectDelay / 1000)}s)...
              </span>
            </div>
          </div>
        )}

        {isEcencyAdmin && showAdminTools && (
          <AdminPanel admin={channelAdmin} />
        )}

        <div className="flex flex-1 min-h-0 flex-col gap-3">
          {/* Messages list */}
          <div className="relative rounded border border-[--border-color] bg-[--background-color] flex-1 min-h-0 md:min-h-[340px]">
            {isLoading && (
              <div className="p-4 text-sm text-[--text-muted]">Loading messages…</div>
            )}
            {error && (
              <div className="p-4 text-sm text-red-500">
                {(error as Error).message || "Failed to load"}
              </div>
            )}
            {moderationError && (
              <div className="p-4 text-sm text-red-500">{moderationError}</div>
            )}
            {!isLoading && !posts.length && !showJoinPrompt && (
              <div className="p-4 text-sm text-[--text-muted]">
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
            {!showJoinPrompt && !isLoading && posts.length > 0 && (
              <VirtualizedMessageList
                groupedPosts={groupedPosts}
                showUnreadDivider={showUnreadDivider}
                firstUnreadIndex={firstUnreadIndex}
                expandedJoinGroups={expandedJoinGroups}
                setExpandedJoinGroups={setExpandedJoinGroups}
                channelId={channelId}
                usersById={usersById}
                channelData={channelData}
                activeUser={activeUser ?? undefined}
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
                handlePinToggle={handlePinToggle}
                toggleReaction={toggleReaction}
                openReactionPostId={openReactionPostId}
                setOpenReactionPostId={setOpenReactionPostId}
                deletingPostId={deletingPostId}
                reactMutationPending={reactMutation.isPending}
                deleteMutationPending={deleteMutation.isPending}
                canPin={canPin}
                pinMutationPending={pinPostMutation.isPending || unpinPostMutation.isPending}
                onStartReached={onStartReached}
                onAtBottomStateChange={onAtBottomStateChange}
                isFetchingNextPage={isFetchingNextPage ?? false}
                virtuosoRef={virtuosoRef}
                initialScrollIndex={initialScrollIndex}
              />
            )}

            {/* Scroll to bottom button - absolute positioned FAB */}
            {showScrollToBottom && (
              <div className="absolute bottom-4 right-4 z-20">
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="flex items-center gap-2 rounded-full border border-[--border-color] bg-[--surface-color] px-4 py-2.5 text-sm font-semibold text-[--text-color] shadow-lg shadow-[rgba(0,0,0,0.12)] transition-all hover:bg-[--hover-color] hover:shadow-xl active:scale-95 dark:border-transparent dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600"
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
        typingUsernames={typingUsernames}
      />

      <KeyboardShortcutsModal
        show={showKeyboardShortcuts}
        onHide={() => setShowKeyboardShortcuts(false)}
      />

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

