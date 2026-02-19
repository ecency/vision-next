import { useAuth } from "@/features/auth/hooks";
import { useNavigate } from "@tanstack/react-router";
import { useComment } from "@ecency/sdk";
import { useMutation } from "@tanstack/react-query";
import { createPermlink } from "../utils/permlink";
import { createBroadcastAdapter } from "@/providers/sdk";

export function usePublishPost({ beforeNavigate }: { beforeNavigate?: () => void } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adapter = createBroadcastAdapter();
  const commentMutation = useComment(user?.username, { adapter });

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

      const permlink = createPermlink(title, true);

      const result = await commentMutation.mutateAsync({
        author: user.username,
        permlink,
        parentAuthor: "",
        parentPermlink: tags[0].toLowerCase().trim(),
        title: title.trim(),
        body: body.trim(),
        jsonMetadata: {
          tags,
          app: "ecency-selfhost/1.0",
          format: "markdown",
        },
      });

      return result;
    },
    onSuccess: () => {
      beforeNavigate?.();
      navigate({ to: "/blog", search: { filter: "posts" } });
    },
  });
}
