import { useAuth } from "@/features/auth/hooks";
import { useNavigate } from "@tanstack/react-router";
import { useComment } from "@ecency/sdk";
import { useMutation } from "@tanstack/react-query";
import { createBroadcastAdapter } from "@/providers/sdk";

export function useUpdatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adapter = createBroadcastAdapter();
  const commentMutation = useComment(user?.username, { adapter });

  return useMutation({
    mutationKey: ["update-post"],
    mutationFn: async ({
      permlink,
      parentPermlink,
      title,
      body,
      tags,
    }: {
      permlink: string;
      parentPermlink: string;
      title: string;
      body: string;
      tags: string[];
    }) => {
      if (!user) {
        throw new Error("Authentication required to update post");
      }

      if (!title.trim()) {
        throw new Error("Title cannot be empty");
      }

      if (!body.trim()) {
        throw new Error("Post content cannot be empty");
      }

      const normalizedTags = [...new Set(
        tags
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0)
      )];

      if (!normalizedTags.length) {
        throw new Error("At least one tag is required");
      }

      return commentMutation.mutateAsync({
        author: user.username,
        permlink,
        parentAuthor: "",
        parentPermlink,
        title: title.trim(),
        body: body.trim(),
        jsonMetadata: {
          tags: normalizedTags,
          app: "ecency-selfhost/1.0",
          format: "markdown",
        },
      });
    },
    onSuccess: (_data, variables) => {
      if (!user?.username) return;

      navigate({
        to: "/$author/$permlink",
        params: { author: user.username, permlink: variables.permlink },
        search: { raw: undefined },
      });
    },
  });
}
