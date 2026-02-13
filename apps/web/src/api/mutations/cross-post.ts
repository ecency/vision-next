"use client";

import { useMutation } from "@tanstack/react-query";
import { error, success } from "@/features/shared";
import { Entry } from "@/entities";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { makeCrossPostMessage } from "@/utils/cross-post";
import { makeApp } from "@/utils";
import pack from "../../../package.json";
import { formatError } from "@/api/operations";
import i18next from "i18next";
import { useCrossPostMutation } from "@/api/sdk-mutations";

export function useCrossPost(entry: Entry, onSuccess: () => void) {
  const { activeUser } = useActiveAccount();
  const sdkCrossPost = useCrossPostMutation();

  return useMutation({
    mutationKey: ["crossPost"],
    mutationFn: async ({
      community,
      message
    }: {
      community: { id: string; name: string };
      message: string;
    }) => {
      if (!community || !activeUser) {
        return;
      }

      const { title } = entry;
      const author = activeUser.username;
      const permlink = `${entry.permlink}-${community.id}`;

      const body = makeCrossPostMessage(entry, author, message);
      const jsonMeta = {
        app: makeApp(pack.version),
        tags: ["cross-post"],
        original_author: entry.author,
        original_permlink: entry.permlink
      };

      // Use SDK mutation with declined payout options
      return sdkCrossPost.mutateAsync({
        author,
        permlink,
        parentPermlink: community.id,
        title,
        body,
        jsonMetadata: jsonMeta,
        options: {
          maxAcceptedPayout: "0.000 HBD",
          percentHbd: 10000,
          allowVotes: true,
          allowCurationRewards: false
        }
      });
    },
    onSuccess: () => {
      success(i18next.t("cross-post.published"));
      onSuccess();
    },
    onError: (e) => error(...formatError(e))
  });
}
