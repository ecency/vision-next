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

      // Check if post is valid
      let post: Entry | null;
      try {
        post = await queryClient.fetchQuery(
          getPostHeaderQueryOptions(author, permlink)
        );
      } catch (e) {
        post = null;
      }

      if (!post) {
        throw new Error(i18next.t("redeem-common.post-error"));
      }

      // Check if the post already promoted
      const promoted = await getPromotedPost(
        getAccessToken(activeUser!.username),
        author,
        permlink
      );
      if (promoted) {
        throw new Error(i18next.t("redeem-common.post-promoted-exists"));
      }

      return;
    },
    onSuccess,
    onError: (e) => error(...formatError(e))
  });
}
