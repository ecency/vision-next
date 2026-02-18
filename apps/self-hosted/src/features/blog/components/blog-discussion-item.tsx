'use client';

import { renderPostBody } from '@ecency/render-helper';
import type { Entry } from '@ecency/sdk';
import { UilComment, UilHeart } from '@tooni/iconscout-unicons-react';
import { useMemo, useState } from 'react';
import { formatRelativeTime } from '@/core';
import { UserAvatar } from '@/features/shared/user-avatar';
import { BlogDiscussionList } from './blog-discussion-list';

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
          x.parent_permlink === entry.permlink,
      ).length,
    [discussionList, entry],
  );

  const hasReplies = repliesCount > 0;
  const createdDate = useMemo(
    () => formatRelativeTime(entry.created),
    [entry.created],
  );

  const entryLink = useMemo(() => {
    // Comments should have same link as regular post
    // Use the same URL pattern as the post page routes
    // If category exists, use /:category/:author/:permlink, otherwise /:author/:permlink
    if (entry.category && entry.category !== 'created') {
      return `/${entry.category}/@${entry.author}/${entry.permlink}`;
    }
    return `/@${entry.author}/${entry.permlink}`;
  }, [entry]);

  return (
    <div className="border-l-2 border-theme pl-3 sm:pl-6 py-3 sm:py-4">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="shrink-0">
          <UserAvatar username={entry.author} size="medium" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 text-xs sm:text-sm text-theme-muted font-theme-ui">
            <a
              href={`/@${entry.author}`}
              className="font-semibold transition-theme hover:opacity-70 text-theme-primary"
            >
              @{entry.author}
            </a>
            <span>•</span>
            <a href={entryLink} className="transition-theme hover:opacity-70">
              {createdDate}
            </a>
          </div>

          <div className="mt-2">
            {isRawContent ? (
              <pre className="text-sm font-mono whitespace-pre-wrap break-words bg-theme-tertiary p-2 rounded-theme-sm text-theme-primary">
                {entry.body}
              </pre>
            ) : (
              <div
                className="markdown-body text-sm! max-w-none entry-body"
                dangerouslySetInnerHTML={{
                  __html: renderPostBody(entry.body, false),
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs text-theme-muted font-theme-ui">
            <div className="flex items-center gap-1">
              <UilHeart className="w-3 h-3" />
              <span>{likesCount}</span>
            </div>
            {hasReplies && (
              <button
                type="button"
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 transition-theme hover:opacity-70"
              >
                <UilComment className="w-3 h-3" />
                <span>
                  {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
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
