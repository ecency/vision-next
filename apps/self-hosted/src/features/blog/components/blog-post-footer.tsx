"use client";

import { Entry } from "@ecency/sdk";
import { useMemo } from "react";
import { UilComment, UilHeart, UilRedo } from "@tooni/iconscout-unicons-react";

interface Props {
  entry: Entry;
}

export function BlogPostFooter({ entry }: Props) {
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

  return (
    <footer className="mb-8 pt-8 border-t border-gray-200">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/trending/${tag}`}
              className="text-sm px-2 py-1 rounded-full transition-opacity hover:opacity-70"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                color: 'rgba(0, 0, 0, 0.68)',
                fontFamily: '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
              }}
            >
              #{tag}
            </a>
          ))}
        </div>
      )}

      <div 
        className="flex flex-wrap items-center gap-6 text-sm"
        style={{ color: 'rgba(0, 0, 0, 0.54)', fontFamily: '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }}
      >
        <div className="flex items-center gap-1">
          <UilHeart className="w-4 h-4" />
          <span>{likesCount} likes</span>
        </div>
        <div className="flex items-center gap-1">
          <UilComment className="w-4 h-4" />
          <span>{commentsCount} comments</span>
        </div>
        <div className="flex items-center gap-1">
          <UilRedo className="w-4 h-4" />
          <span>{reblogsCount} reblogs</span>
        </div>
      </div>
    </footer>
  );
}
