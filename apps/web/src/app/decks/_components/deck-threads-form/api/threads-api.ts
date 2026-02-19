import { v4 } from "uuid";
import { ThreadItemEntry } from "../../columns/deck-threads-manager";
import { useContext } from "react";
import { PollsContext } from "@/features/polls";
import { Entry, FullAccount } from "@/entities";
import { createReplyPermlink, tempEntry } from "@/utils";
import { EntryMetadataManagement } from "@/features/entry-management";
import { useCommentMutation } from "@/api/sdk-mutations";
import type { CommentPayload } from "@ecency/sdk";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useActiveAccount } from "@/core/hooks";
import { getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

export function useThreadsApi() {
  const { username, account, isLoading } = useActiveAccount();
  const { activePoll } = useContext(PollsContext);

  const { addReply } = EcencyEntriesCacheManagement.useAddReply();
  const { updateRepliesCount } = EcencyEntriesCacheManagement.useUpdateRepliesCount();
  const { mutateAsync: sdkComment } = useCommentMutation();

  const request = async (entry: Entry, raw: string, editingEntry?: ThreadItemEntry) => {
    if (!username) {
      throw new Error("No user");
    }

    // Wait for account data if still loading
    let authorData: FullAccount;
    if (isLoading) {
      const accountData = await getQueryClient().fetchQuery(getAccountFullQueryOptions(username));
      if (!accountData) {
        throw new Error("[Deck][Thread-API] – Failed to load account data");
      }
      authorData = accountData;
    } else if (!account) {
      throw new Error("[Deck][Thread-API] – Account data not available");
    } else {
      authorData = account;
    }

    const { author: parentAuthor, permlink: parentPermlink } = editingEntry?.container ?? entry;
    const author = username;
    const permlink = editingEntry?.permlink ?? createReplyPermlink(entry.author);
    const tags = raw.match(/\#[a-zA-Z0-9]+/g)?.map((tag) => tag.replace("#", "")) ?? ["ecency"];

    const jsonMeta = EntryMetadataManagement.EntryMetadataManager.shared
      .builder()
      .default()
      .withTags(tags)
      .withPoll(activePoll)
      .build();

    // Build SDK comment payload
    const commentPayload: CommentPayload = {
      author,
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

    const nReply = tempEntry({
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

    // add new reply to store
    addReply(nReply, entry);

    if (entry.children === 0) {
      // Activate discussion [...sections] with first comment.
      const nEntry: Entry = {
        ...entry,
        children: 1
      };
      updateRepliesCount(1, entry);
    }

    return nReply;
  };

  return { request };
}
