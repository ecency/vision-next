'use client';

import type { Entry } from '@ecency/sdk';
import { UilComment } from '@tooni/iconscout-unicons-react';
import { useMemo } from 'react';
import { InstanceConfigManager, t } from '@/core';
import { VoteButton, ReblogButton } from '@/features/auth';

interface Props {
  entry: Entry;
}

export function BlogPostFooter({ entry }: Props) {
  const entryData = entry.original_entry || entry;

  const showLikes = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.instanceConfiguration.features.likes?.enabled ?? true,
  );
  const showComments = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.instanceConfiguration.features.comments?.enabled ?? true,
  );

  const commentsCount = entryData.children || 0;
  const reblogsCount = entryData.reblogs || 0;

  const tags = useMemo(() => {
    const rawTags = entryData.json_metadata?.tags;
    if (!Array.isArray(rawTags)) return [];
    return rawTags.filter((tag) => tag !== entryData.community);
  }, [entryData]);

  return (
    <footer className="mb-6 sm:mb-8 pt-6 sm:pt-8 border-t border-theme">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs sm:text-sm px-2 py-1 tag-theme"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-theme-muted font-theme-ui">
        {showLikes && (
          <VoteButton
            author={entryData.author}
            permlink={entryData.permlink}
            activeVotes={entryData.active_votes || []}
          />
        )}
        {showComments && (
          <div className="flex items-center gap-1">
            <UilComment className="w-4 h-4" />
            <span>
              {commentsCount} {t('comments')}
            </span>
          </div>
        )}
        <ReblogButton
          author={entryData.author}
          permlink={entryData.permlink}
          reblogCount={reblogsCount}
        />
      </div>
    </footer>
  );
}
