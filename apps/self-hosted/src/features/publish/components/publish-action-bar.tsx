import { motion } from "framer-motion";
import { usePublishState } from "../hooks/use-publish-state";
import { usePublishPost } from "../hooks/use-publish-post";
import { useIsBlogOwner } from "@/features/auth/hooks";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  onSuccess?: () => void;
}

export function PublishActionBar({ onSuccess }: Props) {
  const { title, content, tags, clearAll } = usePublishState();
  const { publishPost, isPublishing, error } = usePublishPost();
  const isBlogOwner = useIsBlogOwner();
  const navigate = useNavigate();

  const canPublish = title.trim().length > 0 && content.trim().length > 0;

  const handlePublish = async () => {
    if (!canPublish || isPublishing) return;

    try {
      await publishPost(title, content, tags);
      clearAll();
      
      // Redirect to blog page after successful publish
      navigate({ to: "/blog", search: { filter: "posts" } });
      
      onSuccess?.();
    } catch (err) {
      // Error is handled by usePublishPost hook
      console.error("Failed to publish:", err);
    }
  };

  if (!isBlogOwner) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ delay: 0.4 }}
      className="container max-w-[1024px] mx-auto px-2 md:px-4 py-4 flex justify-end"
    >
      <div className="flex flex-col items-end gap-2">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish || isPublishing}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            canPublish && !isPublishing
              ? "bg-blue-600 hover:bg-blue-700 text-white"
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
  );
}
