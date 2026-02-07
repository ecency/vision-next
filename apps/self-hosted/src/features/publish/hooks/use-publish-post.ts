import { useAuth } from "@/features/auth/hooks";
import { useNavigate } from "@tanstack/react-router";
import type { Operation } from "@hiveio/dhive";
import { useMutation } from "@tanstack/react-query";
import { createPermlink } from "../utils/permlink";
import { broadcast } from "@/features/auth/auth-actions";

export function usePublishPost() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ["publish-post"],
    mutationFn: async ({
      title,
      body,
      tags,
    }: {
      title: string;
      body: string;
      tags: string[];
    }) => {
      if (!user) {
        throw new Error("Authentication required to publish post");
      }

      if (!title.trim()) {
        throw new Error("Title cannot be empty");
      }

      if (!body.trim()) {
        throw new Error("Post content cannot be empty");
      }

      if (!tags.length) {
        throw new Error("At least one tag is required");
      }

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
          parent_permlink: tags[0],
          author: user.username,
          permlink,
          title: title.trim(),
          body: body.trim(),
          json_metadata: JSON.stringify({
            tags: tags.length > 0 ? tags : [],
            app: "ecency-selfhost/1.0",
            format: "markdown",
          }),
        },
      ];

      await broadcast([postOp]);

      return { success: true, permlink };
    },
    onSuccess: () => {
      navigate({ to: "/blog", search: { filter: "posts" } });
    },
  });
}
