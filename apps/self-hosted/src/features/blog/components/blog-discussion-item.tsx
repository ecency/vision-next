"use client";

import { Entry } from "@ecency/sdk";
import { useMemo, useState, memo } from "react";
import { EcencyRenderer } from "@ecency/renderer";
import { UilHeart, UilComment } from "@tooni/iconscout-unicons-react";
import { BlogDiscussionList } from "./blog-discussion-list";
import { UserAvatar } from "@/features/shared/user-avatar";
import { formatRelativeTime, t } from "@/core";

const MemoEcencyRenderer = memo(EcencyRenderer);

interface Props {
  entry: Entry;
  discussionList: Entry[];
  root: Entry;
  isRawContent?: boolean;
}

export function BlogDiscussionItem({
  entry,
  discussionList,
  root,
  isRawContent,
}: Props) {
  const [showReplies, setShowReplies] = useState(false);

  const likesCount = useMemo(() => entry.active_votes?.length || 0, [entry]);

  const repliesCount = useMemo(
    () =>
      discussionList.filter(
        (x) =>
          x.parent_author === entry.author &&
          x.parent_permlink === entry.permlink
      ).length,
    [discussionList, entry]
  );

  const hasReplies = repliesCount > 0;
  const createdDate = useMemo(
    () => formatRelativeTime(entry.created),
    [entry.created]
  );

  const entryLink = useMemo(() => {
    // Comments should have same link as regular post
    // Use the same URL pattern as the post page routes
    // If category exists, use /:category/:author/:permlink, otherwise /:author/:permlink
    if (entry.category && entry.category !== "created") {
      return `/${entry.category}/@${entry.author}/${entry.permlink}`;
    }
    return `/@${entry.author}/${entry.permlink}`;
  }, [entry]);

  return (
    <div className="border-l-2 border-gray-200 pl-3 sm:pl-6 py-3 sm:py-4">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="shrink-0">
          <UserAvatar username={entry.author} size="medium" />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="flex items-center gap-1.5 sm:gap-2 mb-2 text-xs sm:text-sm"
            style={{
              color: "rgba(0, 0, 0, 0.54)",
              fontFamily:
                '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
            }}
          >
            <a
              href={`/@${entry.author}`}
              className="font-semibold transition-opacity hover:opacity-70"
              style={{ color: "rgba(0, 0, 0, 0.84)" }}
            >
              @{entry.author}
            </a>
            <span>•</span>
            <a href={entryLink} className="transition-opacity hover:opacity-70">
              {createdDate}
            </a>
          </div>

          <div className="mt-2">
            {isRawContent ? (
              <pre
                className="text-sm font-mono whitespace-pre-wrap break-words bg-gray-50 p-2 rounded"
                style={{ color: "rgba(0, 0, 0, 0.84)" }}
              >
                {entry.body}
              </pre>
            ) : (
              <div className="markdown-body text-sm! max-w-none">
                <MemoEcencyRenderer value={entry.body} />
              </div>
            )}
          </div>

          <div
            className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs"
            style={{
              color: "rgba(0, 0, 0, 0.54)",
              fontFamily:
                '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
            }}
          >
            <div className="flex items-center gap-1">
              <UilHeart className="w-3 h-3" />
              <span>{likesCount}</span>
            </div>
            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 transition-opacity hover:opacity-70"
              >
                <UilComment className="w-3 h-3" />
                <span>
                  {repliesCount} {repliesCount === 1 ? "reply" : "replies"}
                </span>
              </button>
            )}
          </div>

          {showReplies && hasReplies && (
            <div className="mt-4 ml-4">
              <BlogDiscussionList
                discussionList={discussionList}
                parent={entry}
                root={root}
                isRawContent={isRawContent}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
