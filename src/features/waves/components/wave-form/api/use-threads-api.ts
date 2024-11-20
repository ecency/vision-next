import { v4 } from "uuid";
import { useContext } from "react";
import { useGlobalStore } from "@/core/global-store";
import { PollsContext } from "@/features/polls";
import { Entry, FullAccount, WaveEntry } from "@/entities";
import { createReplyPermlink, tempEntry } from "@/utils";
import { EntryMetadataManagement } from "@/features/entry-management";
import { comment } from "@/api/operations";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { validatePostCreating } from "@/api/hive";
import { addReplyToDiscussionsList } from "@/api/queries";

export function useThreadsApi() {
  const queryClient = useQueryClient();
  const activeUser = useGlobalStore((s) => s.activeUser);
  const { activePoll } = useContext(PollsContext);

  const { addReply } = EcencyEntriesCacheManagement.useAddReply();
  const { updateRepliesCount } = EcencyEntriesCacheManagement.useUpdateRepliesCount();

  return useMutation({
    mutationKey: ["wave-threads-api"],
    mutationFn: async ({
      entry,
      raw,
      editingEntry
    }: {
      entry: Entry;
      raw: string;
      editingEntry?: WaveEntry;
    }) => {
      if (!activeUser || !activeUser.data.__loaded) {
        throw new Error("No user");
      }

      const { author: parentAuthor, permlink: parentPermlink } = editingEntry?.container ?? entry;
      const author = activeUser.username;
      const permlink = editingEntry?.permlink ?? createReplyPermlink(entry.author);
      const tags = raw.match(/\#[a-zA-Z0-9]+/g)?.map((tag) => tag.replace("#", "")) ?? ["ecency"];

      const jsonMeta = EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .withTags(tags)
        .withPoll(activePoll)
        .build();

      await comment(author, parentAuthor, parentPermlink, permlink, "", raw, jsonMeta, null, true);
      await validatePostCreating(activeUser?.username, permlink);

      const nReply = tempEntry({
        author: activeUser.data as FullAccount,
        permlink,
        parentAuthor,
        parentPermlink,
        title: "",
        body: raw,
        tags,
        description: null,
        post_id: v4()
      });

      // add new reply to cache
      addReply(nReply, entry);
      addReplyToDiscussionsList(entry, nReply, queryClient);

      if (entry.children === 0) {
        updateRepliesCount(1, entry);
      }

      return nReply;
    }
  });
}
