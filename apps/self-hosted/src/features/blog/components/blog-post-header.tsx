"use client";

import { Entry } from "@ecency/sdk";
import { useMemo } from "react";
import { UilComment, UilHeart, UilRedo } from "@tooni/iconscout-unicons-react";
import { formatDistanceToNow } from "date-fns";

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
      <h1
        className="text-4xl md:text-5xl font-bold mb-6 break-words"
        style={{
          fontFamily:
            '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          color: "rgba(0, 0, 0, 0.84)",
          letterSpacing: "-0.015em",
          lineHeight: "1.04",
        }}
      >
        {entryData.title}
      </h1>

      <div
        className="flex flex-wrap items-center gap-3 text-sm mb-6"
        style={{
          color: "rgba(0, 0, 0, 0.54)",
          fontFamily:
            '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        }}
      >
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
        <span>{readTime} min read</span>
        <span>•</span>
        <span>{createdDate}</span>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/trending/${tag}`}
              className="text-sm px-2 py-1 rounded-full transition-opacity hover:opacity-70"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.05)",
                color: "rgba(0, 0, 0, 0.68)",
                fontFamily:
                  '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
              }}
            >
              #{tag}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
