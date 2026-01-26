import { useCallback, useState } from "react";
import { useAuth } from "@/features/auth/hooks";
import { createPermlink } from "../utils/permlink";
import type { Operation } from "@/features/auth/types";

export function usePublishPost() {
  const { broadcast, user } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishPost = useCallback(
    async (title: string, body: string, tags: string[] = []) => {
      if (!user) {
        setError("Authentication required to publish post");
        return;
      }

      if (!title.trim()) {
        setError("Title cannot be empty");
        return;
      }

      if (!body.trim()) {
        setError("Post content cannot be empty");
        return;
      }

      setIsPublishing(true);
      setError(null);

      try {
        // Generate permlink from title
        let permlink = createPermlink(title);
        
        // If permlink already exists or is too short, add random suffix
        // In a real implementation, you might want to check if permlink exists
        // For now, we'll add random suffix to ensure uniqueness
        permlink = createPermlink(title, true);

        // Create the post operation (top-level post has empty parent)
        const postOp: Operation = [
          "comment",
          {
            parent_author: "",
            parent_permlink: "",
            author: user.username,
            permlink,
            title: title.trim(),
            body: body.trim(),
            json_metadata: JSON.stringify({
              tags: tags.length > 0 ? tags : [],
              app: "ecency-selfhost/1.0",
              format: "markdown"
            })
          }
        ];

        await broadcast([postOp]);

        return { success: true, permlink };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to publish post";
        setError(errorMessage);
        console.error("Publish failed:", err);
        throw err;
      } finally {
        setIsPublishing(false);
      }
    },
    [broadcast, user]
  );

  return {
    publishPost,
    isPublishing,
    error
  };
}
