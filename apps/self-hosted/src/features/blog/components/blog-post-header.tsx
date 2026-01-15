'use client';

import type { Entry } from '@ecency/sdk';
import { UilComment, UilHeart, UilRedo } from '@tooni/iconscout-unicons-react';
import { useMemo } from 'react';
import { formatRelativeTime, t } from '@/core';

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
        <span>•</span>
        <span>{createdDate}</span>
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
