import { motion } from "framer-motion";
import { usePublishState } from "../hooks/use-publish-state";
import { usePublishPost } from "../hooks/use-publish-post";
import { Link } from "@tanstack/react-router";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";

interface Props {
  onSuccess?: () => void;
}

export function PublishActionBar({ onSuccess }: Props) {
  const { title, content, tags, clearAll } = usePublishState();
  const {
    mutateAsync: publishPost,
    isPending: isPublishing,
    error,
  } = usePublishPost({ beforeNavigate: clearAll });

  const safeTitle = title ?? "";
  const safeContent = content ?? "";
  const safeTags = tags ?? [];

  const canPublish =
    safeTitle.trim().length > 0 &&
    safeContent.trim().length > 0 &&
    safeTags.length > 0;

  const handlePublish = async () => {
    if (!canPublish || isPublishing) return;

    try {
      await publishPost({
        title: safeTitle,
        body: safeContent,
        tags: safeTags,
      });
      onSuccess?.();
    } catch (err) {
      // Error is handled by usePublishPost hook
      console.error("Failed to publish:", err);
    }
  };

  return (
    <div className="max-w-[1024px] mx-auto flex justify-between items-center">
      <Link
        search={{ filter: "posts" }}
        className="text-sm flex items-center gap-2 whitespace-nowrap"
        to="/blog"
      >
        <UilArrowLeft />
        Back to blog
      </Link>
      <motion.div
        initial={{ opacity: 0, y: -32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-2 md:px-4 py-4 flex justify-end"
      >
        <div className="flex flex-col items-end gap-2">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded">
              {error.message}
            </div>
          )}
          <button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish || isPublishing}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
              canPublish && !isPublishing
                ? "bg-black hover:bg-black/80 text-white cursor-pointer"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            {isPublishing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </span>
            ) : (
              "Publish"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
