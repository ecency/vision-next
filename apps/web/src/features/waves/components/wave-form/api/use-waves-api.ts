import { v4 } from "uuid";
import { useContext } from "react";
import { PollsContext } from "@/features/polls";
import { Entry, FullAccount, WaveEntry } from "@/entities";
import { createReplyPermlink, createWavePermlink, tempEntry } from "@/utils";
import { EntryMetadataManagement } from "@/features/entry-management";
import { useCommentMutation } from "@/api/sdk-mutations";
import type { CommentPayload } from "@ecency/sdk";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { validatePostCreating } from "@ecency/sdk";
import { getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions, getDiscussionsQueryOptions, SortOrder as SDKSortOrder } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks";
import { SortOrder } from "@/enums";

export function useWavesApi() {
  const queryClient = useQueryClient();
  const { username, account, isLoading } = useActiveAccount();

  const { activePoll } = useContext(PollsContext);

  const { updateRepliesCount } = EcencyEntriesCacheManagement.useUpdateRepliesCount();
  const { mutateAsync: sdkComment } = useCommentMutation();

  return useMutation({
    mutationKey: ["wave-threads-api"],
    mutationFn: async ({
      entry,
      raw,
      editingEntry,
      host
    }: {
      entry: Entry;
      raw: string;
      editingEntry?: WaveEntry;
      host?: string;
    }) => {
      if (!username) {
        throw new Error("[Wave][Thread-base][API] – No active user");
      }

      // Wait for account data if still loading
      let authorData: FullAccount;
      if (isLoading) {
        const accountData = await getQueryClient().fetchQuery(getAccountFullQueryOptions(username));
        if (!accountData) {
          throw new Error("[Wave][Thread-base][API] – Failed to load account data");
        }
        authorData = accountData;
      } else if (!account) {
        throw new Error("[Wave][Thread-base][API] – Account data not available");
      } else {
        authorData = account;
      }

      const parentAuthor = editingEntry?.parent_author ?? entry.author;
      const parentPermlink = editingEntry?.parent_permlink ?? entry.permlink;

      let permlink = editingEntry?.permlink ?? createReplyPermlink(entry.author);

      if (host === "ecency.waves" && !editingEntry) {
        permlink = createWavePermlink();
      }
      const tags = raw.match(/\#[a-zA-Z0-9]+/g)?.map((tag) => tag.replace("#", "")) ?? ["ecency"];

      const jsonMeta = EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .withTags(tags)
        .withPoll(activePoll)
        .build();

      // Build SDK comment payload
      const commentPayload: CommentPayload = {
        author: username,
        permlink,
        parentAuthor,
        parentPermlink,
        title: "",
        body: raw,
        jsonMetadata: jsonMeta,
        rootAuthor: entry.author,
        rootPermlink: entry.permlink
      };

      await sdkComment(commentPayload);
      if (!editingEntry) {
        // For newly created waves we still confirm blockchain propagation but
        // with shorter retry delays so the UI is not blocked for several
        // seconds when the post appears quickly.
        await validatePostCreating(username, permlink, 0, {
          delays: [750, 1500, 2250]
        });
      }

      const tempReply = editingEntry
        ? {
            ...editingEntry,
            body: raw
          }
        : tempEntry({
            author: authorData,
            permlink,
            parentAuthor,
            parentPermlink,
            title: "",
            body: raw,
            tags,
            description: null,
            post_id: v4()
          });

      if (!editingEntry) {
        // Inline cache update for discussions list
        const options = getDiscussionsQueryOptions(entry, SDKSortOrder.created, true, entry?.author);
        queryClient.setQueryData<Entry[]>(options.queryKey, (data) => [...(data ?? []), tempReply]);
        updateRepliesCount(entry.children + 1, entry);
      }

      EcencyEntriesCacheManagement.updateEntryQueryData([tempReply], queryClient);

      return tempReply;
    }
  });
}
