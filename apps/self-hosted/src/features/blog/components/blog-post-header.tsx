"use client";

import { Entry } from "@ecency/sdk";
import { useMemo } from "react";
import { UilComment, UilHeart, UilRedo } from "@tooni/iconscout-unicons-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  entry: Entry;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
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
    [entryData]
  );

  const commentsCount = entryData.children || 0;
  const reblogsCount = entryData.reblogs || 0;

  const tags = useMemo(() => {
    return (
      entryData.json_metadata?.tags?.filter(
        (tag) => tag !== entryData.community
      ) || []
    );
  }, [entryData]);

  const readTime = useMemo(
    () => calculateReadTime(entryData.body),
    [entryData.body]
  );

  const createdDate = useMemo(
    () => formatDistanceToNow(new Date(entryData.created), { addSuffix: true }),
    [entryData.created]
  );

  return (
    <header className="mb-8">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 dark:text-white break-words">
        {entryData.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
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
        <span className="separator">•</span>
        <span>{readTime} min read</span>
        <span className="separator">•</span>
        <span>{createdDate}</span>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/trending/${tag}`}
              className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 transition-colors"
            >
              #{tag}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

