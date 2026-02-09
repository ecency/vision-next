import { type ReactNode, useCallback, useMemo } from "react";
import type { MattermostPost, MattermostUser } from "../mattermost-api";
import {
  getPostDisplayName,
  getPostUsername,
  getAddedUserDisplayName,
  getDisplayMessage
} from "../format-utils";
import { decodeMessageEmojis } from "../emoji-utils";
import { proxifyImageSrc } from "@ecency/render-helper";
import { MentionToken } from "../components/mention-token";
import { ChatImage } from "../components/chat-image";
import { HivePostLinkRenderer } from "@/features/post-renderer";
import { USER_MENTION_PURE_REGEX } from "@/features/tiptap-editor/extensions/user-mention-extension-config";
import DOMPurify from "dompurify";
import htmlParse, { domToReact, type HTMLReactParserOptions } from "html-react-parser";
import { Element, Text } from "domhandler";
import { marked } from "marked";

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

    return pathParts.length <= 1;
  } catch {
    return false;
  }
}

interface UseMessageRenderingParams {
  usersById: Record<string, MattermostUser>;
  usersByUsername: Record<string, MattermostUser>;
  activeUsername: string | undefined;
  canUseWebp: boolean;
  startDirectMessage: (username: string) => void;
  normalizeUsername: (username?: string | null) => string | undefined;
}

export function useMessageRendering({
  usersById,
  usersByUsername,
  activeUsername,
  canUseWebp,
  startDirectMessage,
  normalizeUsername
}: UseMessageRenderingParams) {

  const getProxiedImageUrl = useCallback(
    (url: string) => {
      const format = canUseWebp ? "webp" : "match";
      return proxifyImageSrc(url, 1024, 0, format) || url;
    },
    [canUseWebp]
  );

  const getDisplayName = useCallback(
    (post: MattermostPost) => getPostDisplayName(post, usersById, normalizeUsername),
    [usersById, normalizeUsername]
  );

  const getUsername = useCallback(
    (post: MattermostPost) => getPostUsername(post, usersById, normalizeUsername),
    [usersById, normalizeUsername]
  );

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

  const markdownParser = useMemo(() => {
    marked.setOptions({
      gfm: true,
      breaks: true
    });

    return (content: string) => (marked.parse(content) as string) || "";
  }, []);

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
                currentUsername={activeUsername}
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
  }, [markdownParser, getProxiedImageUrl, usersByUsername, activeUsername, startDirectMessage, ECENCY_POST_LINK_REGEX]);

  return {
    getProxiedImageUrl,
    getDisplayName,
    getUsername,
    getDecodedDisplayMessage,
    renderMessageContent
  };
}
