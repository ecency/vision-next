"use client";

import { Entry } from "@ecency/sdk";
import { useMemo, useState } from "react";
import { EcencyRenderer } from "@ecency/renderer";
import { formatDistanceToNow } from "date-fns";
import { UilHeart, UilComment } from "@tooni/iconscout-unicons-react";
import { BlogDiscussionList } from "./blog-discussion-list";
import { UserAvatar } from "@/features/shared/user-avatar";
import { memo } from "react";

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
    () => formatDistanceToNow(new Date(entry.created), { addSuffix: true }),
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
    <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-2">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <UserAvatar username={entry.author} size="medium" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={`/@${entry.author}`}
              className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
            >
              @{entry.author}
            </a>
            <span className="text-gray-500 dark:text-gray-400 text-sm">•</span>
            <a
              href={entryLink}
              className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300"
            >
              {createdDate}
            </a>
          </div>

          <div className="mt-2">
            {isRawContent ? (
              <pre className="text-sm font-mono whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-900 p-2 rounded">
                {entry.body}
              </pre>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MemoEcencyRenderer value={entry.body} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <UilHeart className="w-4 h-4" />
              <span>{likesCount}</span>
            </div>
            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <UilComment className="w-4 h-4" />
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
