"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Entry } from "@/entities";
import { getPostHeaderQueryOptions, getPromotedPost } from "@ecency/sdk";
import i18next from "i18next";
import { error } from "@/features/shared";
import { formatError } from "../operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";

export function usePreCheckPromote(path: string, onSuccess: () => void) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["preCheckPromote"],
    mutationFn: async () => {
      const [author, permlink] = path.replace("@", "").split("/");

      // Check if post is valid - always fetch fresh data
      let post: Entry | null;
      try {
        post = await queryClient.fetchQuery({
          ...getPostHeaderQueryOptions(author, permlink),
          staleTime: 0 // Force fresh fetch to ensure post exists
        });
      } catch (e) {
        post = null;
      }

      if (!post || !post.author) {
        throw new Error(i18next.t("redeem-common.post-error"));
      }

      // Check if the post already promoted
      try {
        const promoted = await getPromotedPost(
          getAccessToken(activeUser!.username),
          author,
          permlink
        );
        if (promoted) {
          throw new Error(i18next.t("redeem-common.post-promoted-exists"));
        }
      } catch (e: any) {
        // If API returns empty response or JSON parse error, the post is not promoted (which is OK)
        // Only throw if it's an actual error message about the post being promoted
        if (e.message?.includes("promoted-exists") || e.message?.includes("already promoted")) {
          throw e;
        }
        // Otherwise, ignore the error and continue (post is not promoted)
      }

      return;
    },
    onSuccess,
    onError: (e) => error(...formatError(e))
  });
}
