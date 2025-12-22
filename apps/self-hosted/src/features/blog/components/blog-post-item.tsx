import { EcencyRenderer } from "@ecency/renderer";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { Entry } from "@ecency/sdk";
import {
  UilComment,
  UilHeart,
  UilMapPinAlt,
} from "@tooni/iconscout-unicons-react";
import { memo, useMemo } from "react";
import { InstanceConfigManager } from "@/core";
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
      <div className="mb-3">
        {entryData.community && entryData.community_title && (
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Community: {entryData.community_title}
          </span>
        )}
        {!entryData.community && entryData.category && (
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {entryData.category}
          </span>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-3 hover:text-blue-600 dark:hover:text-blue-400">
        <a
          href={`/${entryData.category}/@${entryData.author}/${entryData.permlink}`}
        >
          {entryData.title}
        </a>
      </h2>

      {listType === "grid" && imageUrl && (
        <div className="mb-4 rounded-lg overflow-hidden">
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
        <div className="mb-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
          <UilMapPinAlt className="w-4 h-4 mr-1" />
          <span>{location}</span>
        </div>
      )}

      <div className="mb-4 prose prose-sm dark:prose-invert max-w-none">
        <MemoEcencyRenderer value={summary} />
      </div>

      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/trending/${tag}`}
              className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              #{tag}
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <UilHeart className="w-4 h-4" />
          <span>{likesCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <UilComment className="w-4 h-4" />
          <span>{commentsCount}</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          {new Date(entryData.created).toLocaleDateString()}
        </div>
      </div>
    </>
  );

  return (
    <motion.article
      className={clsx(
        "py-6 px-4 rounded-2xl bg-white dark:bg-gray-900 border border-blue-100",
        listType === "list" && "sticky top-0"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {listType === "list" && imageUrl ? (
        <div className="flex gap-4">
          <div className="flex-1">{contentSection}</div>
          <div className="shrink-0 w-48">
            <a
              href={`/${entryData.category}/@${entryData.author}/${entryData.permlink}`}
            >
              <img
                src={imageUrl}
                alt={entryData.title}
                className="w-full h-32 object-cover rounded-lg"
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
