"use client";

import { Button } from "@ui/button";
import { closeSvg } from "@ui/svg";
import clsx from "clsx";
import type { MattermostPost, MattermostUser } from "../mattermost-api";

interface PinnedMessagesBannerProps {
  channelId: string;
  pinnedPosts: MattermostPost[];
  usersById: Record<string, MattermostUser>;
  canPin: boolean;
  onScrollToPost: (postId: string) => void;
  onUnpin: (postId: string) => void;
  getDisplayName: (post: MattermostPost) => string;
  getDecodedDisplayMessage: (post: MattermostPost) => string;
  onDismiss: () => void;
}

export function PinnedMessagesBanner({
  pinnedPosts,
  canPin,
  onScrollToPost,
  onUnpin,
  getDisplayName,
  getDecodedDisplayMessage,
  onDismiss
}: PinnedMessagesBannerProps) {
  if (pinnedPosts.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 border-b border-[--border-color] bg-[--surface-color] shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Pin icon and count */}
        <div className="flex items-center gap-2 text-sm font-semibold text-[--text-color]">
          <span className="text-blue-500">📌</span>
          <span>{pinnedPosts.length} pinned</span>
        </div>

        {/* Scrollable pinned messages */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-2">
            {pinnedPosts.map((post) => {
              const displayName = getDisplayName(post);
              const message = getDecodedDisplayMessage(post);
              const preview = message.length > 100 ? `${message.slice(0, 100)}...` : message;

              return (
                <div
                  key={post.id}
                  className="group relative flex min-w-[200px] max-w-[300px] cursor-pointer items-center gap-2 rounded-lg border border-[--border-color] bg-[--background-color] px-3 py-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => onScrollToPost(post.id)}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-xs font-semibold text-[--text-color]">
                      {displayName}
                    </div>
                    <div className="truncate text-xs text-[--text-muted]">{preview}</div>
                  </div>

                  {canPin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpin(post.id);
                      }}
                      className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Unpin message"
                      title="Unpin message"
                    >
                      <span className="text-[--text-muted] hover:text-red-500">×</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 text-[--text-muted] hover:text-[--text-color]"
          aria-label="Hide pinned messages"
          title="Hide pinned messages"
        >
          <span className="inline-block w-4 h-4" dangerouslySetInnerHTML={{ __html: closeSvg }} />
        </button>
      </div>
    </div>
  );
}
