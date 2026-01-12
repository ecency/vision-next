import { useContext } from "react";
import { PollsContext } from "@/features/polls";
import { Entry, FullAccount } from "@/entities";
import { createPermlink, makeCommentOptions, tempEntry } from "@/utils";
import { EntryMetadataManagement } from "@/features/entry-management";
import { comment } from "@/api/operations";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useMutation } from "@tanstack/react-query";
import { WaveHosts } from "@/features/waves/enums";
import { DBUZZ_COMMUNITY } from "@/features/waves";
import { useActiveAccount } from "@/core/hooks";
import { getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

interface Body {
  host: string;
  raw: string;
  editingEntry?: Entry;
}

export function useCommunityApi() {
  const { username, account, isLoading } = useActiveAccount();
  const { activePoll } = useContext(PollsContext);

  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();

  return useMutation({
    mutationKey: ["wave-community-api"],
    mutationFn: async ({ host, raw, editingEntry }: Body) => {
      if (!username) {
        throw new Error("No user");
      }

      // Wait for account data if still loading
      let authorData: FullAccount;
      if (isLoading) {
        const accountData = await getQueryClient().fetchQuery(getAccountFullQueryOptions(username));
        if (!accountData) {
          throw new Error("[Wave][Community-API] – Failed to load account data");
        }
        authorData = accountData;
      } else if (!account) {
        throw new Error("[Wave][Community-API] – Account data not available");
      } else {
        authorData = account;
      }

      let hostTag = "";

      if (host === WaveHosts.Dbuzz) {
        hostTag = DBUZZ_COMMUNITY;
      }

      // clean body
      const cleanedRaw = raw.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");
      const author = username;
      const permlink = editingEntry?.permlink ?? createPermlink("", true);
      const options = makeCommentOptions(author, permlink, "default");

      const jsonMeta = EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(raw)
        .withTags([
          hostTag,
          ...(raw.match(/\#[a-zA-Z0-9]+/g)?.map((tag) => tag.replace("#", "")) ?? ["ecency"])
        ])
        .withPoll(activePoll)
        .build();

      await comment(author, "", hostTag, permlink, "", cleanedRaw, jsonMeta, options, true);

      const entry = {
        ...tempEntry({
          author: authorData,
          permlink,
          parentAuthor: "",
          parentPermlink: "",
          title: "",
          body: cleanedRaw,
          tags: [hostTag],
          description: ""
        }),
        max_accepted_payout: options?.max_accepted_payout ?? "1000000.000 HBD",
        percent_hbd: options?.percent_hbd ?? 10000
      };
      updateEntryQueryData([entry]);

      return entry;
    }
  });
}
