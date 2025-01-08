import { v4 } from "uuid";
import { useContext } from "react";
import { useGlobalStore } from "@/core/global-store";
import { PollsContext } from "@/features/polls";
import { Entry, FullAccount, WaveEntry } from "@/entities";
import { createReplyPermlink, createWavePermlink, tempEntry } from "@/utils";
import { EntryMetadataManagement } from "@/features/entry-management";
import { comment } from "@/api/operations";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { validatePostCreating } from "@/api/hive";
import { addReplyToDiscussionsList } from "@/api/queries";

export function useWavesApi() {
  const queryClient = useQueryClient();
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { activePoll } = useContext(PollsContext);

  const { updateRepliesCount } = EcencyEntriesCacheManagement.useUpdateRepliesCount();

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
      if (!activeUser || !activeUser.data.__loaded) {
        throw new Error("[Wave][Thread-base][API] – No active user");
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

      await comment(
        activeUser.username,
        parentAuthor,
        parentPermlink,
        permlink,
        "",
        raw,
        jsonMeta,
        null,
        true
      );
      await validatePostCreating(activeUser?.username, permlink);

      const tempReply = editingEntry
        ? {
            ...editingEntry,
            body: raw
          }
        : tempEntry({
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

      if (!editingEntry) {
        addReplyToDiscussionsList(entry, tempReply, queryClient);
        updateRepliesCount(entry.children + 1, entry);
      }

      EcencyEntriesCacheManagement.updateEntryQueryData([tempReply], queryClient);

      return tempReply;
    }
  });
}
