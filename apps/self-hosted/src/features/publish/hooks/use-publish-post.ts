import { useAuth } from "@/features/auth/hooks";
import { useInstanceConfig } from "@/features/blog/hooks/use-instance-config";
import { useNavigate } from "@tanstack/react-router";
import { useComment } from "@ecency/sdk";
import { useMutation } from "@tanstack/react-query";
import { createPermlink } from "../utils/permlink";
import { resolvePublishTarget } from "../utils/publish-target";
import { createBroadcastAdapter } from "@/providers/sdk";

export function usePublishPost({ beforeNavigate }: { beforeNavigate?: () => void } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isCommunityMode, communityId } = useInstanceConfig();

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

      // In community mode publish into the community (parentPermlink =
      // communityId) with the community tag first; in blog mode the first tag
      // stays the category. The logged-in user remains the author either way.
      const { parentPermlink, tags: metadataTags } = resolvePublishTarget({
        tags,
        isCommunityMode,
        communityId,
      });

      const result = await commentMutation.mutateAsync({
        author: user.username,
        permlink,
        parentAuthor: "",
        parentPermlink,
        title: title.trim(),
        body: body.trim(),
        jsonMetadata: {
          tags: metadataTags,
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
