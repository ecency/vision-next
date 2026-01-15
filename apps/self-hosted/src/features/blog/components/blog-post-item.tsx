import { EcencyRenderer } from "@ecency/renderer";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { Entry } from "@ecency/sdk";
import {
  UilComment,
  UilHeart,
  UilMapPinAlt,
} from "@tooni/iconscout-unicons-react";
import { memo, useMemo } from "react";
import { InstanceConfigManager, formatDate } from "@/core";
import clsx from "clsx";
import { motion } from "framer-motion";

const MemoEcencyRenderer = memo(EcencyRenderer);

interface Props {
  entry: Entry;
  index?: number;
}

export function BlogPostItem({ entry, index = 0 }: Props) {
  const listType = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.layout.listType
  );
  const showLikes = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.features.likes?.enabled ?? true
  );
  const showComments = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.features.comments?.enabled ?? true
  );
  const entryData = entry.original_entry || entry;

  const summary = useMemo(
    () =>
      entryData.json_metadata?.description ||
      postBodySummary(entryData.body, 300),
    [entryData]
  );

  const likesCount = useMemo(
    () => entryData.active_votes?.length || 0,
    [entryData]
  );

  const commentsCount = entryData.children || 0;

  const tags = useMemo(() => {
    return (
      entryData.json_metadata?.tags?.filter(
        (tag) => tag !== entryData.community
      ) || []
    );
  }, [entryData]);

  const location = useMemo(() => {
    if (entryData.json_metadata?.location) {
      const loc = entryData.json_metadata.location;
      if (typeof loc === "string") {
        return loc;
      }
      if (typeof loc === "object" && loc.address) {
        return loc.address;
      }
    }
    return;
  }, [entryData]);

  const imageUrl = useMemo(() => {
    const firstImage = entryData.json_metadata?.image?.[0];
    if (firstImage) {
      return catchPostImage(firstImage, 800, 600) || firstImage;
    }
    return null;
  }, [entryData]);

  const contentSection = (
    <>
      <div className="mb-2">
        {entryData.community && entryData.community_title && (
          <span className="text-xs font-medium text-theme-muted font-theme-ui">
            Community: {entryData.community_title}
          </span>
        )}
        {!entryData.community && entryData.category && (
          <span className="text-xs font-medium text-theme-muted font-theme-ui">
            {entryData.category}
          </span>
        )}
      </div>

      <h2 className="text-xl sm:text-2xl font-bold mb-3 transition-theme hover:opacity-70 heading-theme leading-[1.15]">
        <a
          href={`/${entryData.category}/@${entryData.author}/${entryData.permlink}`}
        >
          {entryData.title}
        </a>
      </h2>

      {listType === "grid" && imageUrl && (
        <div className="mb-4 overflow-hidden">
          <a
            href={`/${entryData.category}/@${entryData.author}/${entryData.permlink}`}
          >
            <img
              src={imageUrl}
              alt={entryData.title}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </a>
        </div>
      )}

      {location && (
        <div className="mb-3 flex items-center text-xs text-theme-muted">
          <UilMapPinAlt className="w-3 h-3 mr-1" />
          <span>{location}</span>
        </div>
      )}

      <div className="mb-4">
        <div className="markdown-body text-sm sm:text-base max-w-none body-theme">
          <MemoEcencyRenderer value={summary} />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/trending/${tag}`}
              className="text-xs px-2 py-1 tag-theme transition-theme"
            >
              #{tag}
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-theme-muted font-theme-ui">
        {showLikes && (
          <div className="flex items-center gap-1">
            <UilHeart className="w-3 h-3" />
            <span>{likesCount}</span>
          </div>
        )}
        {showComments && (
          <div className="flex items-center gap-1">
            <UilComment className="w-3 h-3" />
            <span>{commentsCount}</span>
          </div>
        )}
        {(showLikes || showComments) && <span>•</span>}
        <span>{formatDate(entryData.created)}</span>
      </div>
    </>
  );

  return (
    <motion.article
      className={clsx("py-6 sm:py-8 border-b border-theme")}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {listType === "list" && imageUrl ? (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex-1">{contentSection}</div>
          <div className="shrink-0 w-full sm:w-48">
            <a
              href={`/${entryData.category}/@${entryData.author}/${entryData.permlink}`}
            >
              <img
                src={imageUrl}
                alt={entryData.title}
                className="w-full h-48 sm:h-32 object-cover"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      ) : (
        contentSection
      )}
    </motion.article>
  );
}
