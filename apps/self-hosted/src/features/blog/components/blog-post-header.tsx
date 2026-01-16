'use client';

import type { Entry } from '@ecency/sdk';
import { UilComment, UilHeart, UilRedo } from '@tooni/iconscout-unicons-react';
import { useMemo } from 'react';
import { formatRelativeTime, InstanceConfigManager, t } from '@/core';
import { UserAvatar } from '@/features/shared/user-avatar';

interface Props {
  entry: Entry;
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

function calculateReadTime(body: string): number {
  const wordsPerMinute = 225;
  const wordCount = countWords(body);
  return Math.ceil(wordCount / wordsPerMinute);
}

export function BlogPostHeader({ entry }: Props) {
  const entryData = entry.original_entry || entry;
  const instanceType = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      (configuration.instanceConfiguration.type as string) ?? 'blog',
  );
  const isCommunity = instanceType === 'community';

  const likesCount = useMemo(
    () => entryData.active_votes?.length || 0,
    [entryData],
  );

  const commentsCount = entryData.children || 0;
  const reblogsCount = entryData.reblogs || 0;

  const tags = useMemo(() => {
    return (
      entryData.json_metadata?.tags?.filter(
        (tag) => tag !== entryData.community,
      ) || []
    );
  }, [entryData]);

  const readTime = useMemo(
    () => calculateReadTime(entryData.body),
    [entryData.body],
  );

  const createdDate = useMemo(
    () => formatRelativeTime(entryData.created),
    [entryData.created],
  );

  return (
    <header className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 break-words heading-theme leading-[1.04]">
        {entryData.title}
      </h1>

      {/* Author byline */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <a
          href={`https://ecency.com/@${entryData.author}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <UserAvatar username={entryData.author} size="medium" />
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${isCommunity ? 'text-theme-primary' : 'text-theme-secondary'}`}>
              {entryData.author}
            </span>
            <span className="text-xs text-theme-muted">{createdDate}</span>
          </div>
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm mb-4 sm:mb-6 text-theme-muted font-theme-ui">
        <div className="flex items-center gap-1">
          <UilHeart className="w-4 h-4" />
          <span>{likesCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <UilComment className="w-4 h-4" />
          <span>{commentsCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <UilRedo className="w-4 h-4" />
          <span>{reblogsCount}</span>
        </div>
        <span>•</span>
        <span>
          {readTime} {t('minRead')}
        </span>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/trending/${tag}`}
              className="text-xs sm:text-sm px-2 py-1 tag-theme transition-theme"
            >
              #{tag}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
