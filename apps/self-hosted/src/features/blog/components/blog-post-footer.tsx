"use client";

import { Entry } from "@ecency/sdk";
import { useMemo } from "react";
import { UilComment, UilHeart, UilRedo } from "@tooni/iconscout-unicons-react";
import { InstanceConfigManager, t } from "@/core";

interface Props {
  entry: Entry;
}

export function BlogPostFooter({ entry }: Props) {
  const entryData = entry.original_entry || entry;

  const showLikes = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.features.likes?.enabled ?? true
  );
  const showComments = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.features.comments?.enabled ?? true
  );

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
    <footer className="mb-6 sm:mb-8 pt-6 sm:pt-8 border-t border-theme">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
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

      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-theme-muted font-theme-ui">
        {showLikes && (
          <div className="flex items-center gap-1">
            <UilHeart className="w-4 h-4" />
            <span>{likesCount} {t("likes")}</span>
          </div>
        )}
        {showComments && (
          <div className="flex items-center gap-1">
            <UilComment className="w-4 h-4" />
            <span>{commentsCount} {t("comments")}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <UilRedo className="w-4 h-4" />
          <span>{reblogsCount} {t("reblogs")}</span>
        </div>
      </div>
    </footer>
  );
}
