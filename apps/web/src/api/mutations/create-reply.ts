// src/api/mutations/create-reply.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { comment, formatError } from "../operations";
import { Entry, FullAccount, MetaData, CommentOptions } from "@/entities";
import { tempEntry } from "@/utils";
import { QueryIdentifiers } from "@/core/react-query";
import { SortOrder } from "@/enums";
import { error, success } from "@/features/shared";
import * as ss from "@/utils/session-storage";
import i18next from "i18next";
import { getAccountRcQueryOptions } from "@ecency/sdk";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import {useClientActiveUser} from "@/api/queries";

export function useCreateReply(entry: Entry, root: Entry, onSuccess?: () => void) {
  const activeUser = useClientActiveUser();
  const queryClient = useQueryClient();
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();
  const { addReply } = EcencyEntriesCacheManagement.useAddReply(entry);

  return useMutation({
    mutationKey: ["reply-create", activeUser?.username, entry.author, entry.permlink],
    mutationFn: async ({
                         permlink,
                         text,
                         jsonMeta,
                         options,
                         point
                       }: {
      permlink: string;
      text: string;
      jsonMeta: MetaData;
      point: boolean;
      options?: CommentOptions;
    }) => {
      if (!activeUser || !entry) throw new Error("Missing active user or entry");
      await comment(
          activeUser.username,
          entry.author,
          entry.permlink,
          permlink,
          "",
          text,
          jsonMeta,
          options ?? null,
          point
      );

      return tempEntry({
        author: activeUser.data as FullAccount,
        permlink,
        parentAuthor: entry.author,
        parentPermlink: entry.permlink,
        title: "",
        body: text,
        tags: [],
        description: null
      });
    },

    onMutate: async ({ permlink, text, jsonMeta }) => {
      if (!activeUser) return;

      const optimistic = tempEntry({
        author: activeUser.data as FullAccount,
        permlink,
        parentAuthor: entry.author,
        parentPermlink: entry.permlink,
        title: "",
        body: text,
        tags: [],
        description: null
      });
      optimistic.is_optimistic = true;

      queryClient.setQueryData<Entry[]>(
          [
            QueryIdentifiers.FETCH_DISCUSSIONS,
            root.author,
            root.permlink,
            SortOrder.created,
            activeUser.username
          ],
          (prev = []) => [optimistic, ...prev]
      );

      return { optimistic };
    },

    onSuccess: (realEntry, _, context) => {
      const { optimistic } = context ?? {};

      queryClient.setQueryData<Entry[]>(
          [
            QueryIdentifiers.FETCH_DISCUSSIONS,
            root.author,
            root.permlink,
            SortOrder.created,
            activeUser?.username
          ],
          (prev) =>
              prev?.map((r) =>
                  r.permlink === optimistic?.permlink ? realEntry : r
              ) ?? []
      );

      updateEntryQueryData([realEntry]);
      addReply(realEntry);
      ss.remove(`reply_draft_${entry.author}_${entry.permlink}`);
      queryClient.refetchQueries(getAccountRcQueryOptions(realEntry.author));
      onSuccess?.();
      success(i18next.t("comment.success"));
    },

    onError: (err, _, context) => {
      const { optimistic } = context ?? {};

      queryClient.setQueryData<Entry[]>(
          [
            QueryIdentifiers.FETCH_DISCUSSIONS,
            root.author,
            root.permlink,
            SortOrder.created,
            activeUser?.username
          ],
          (prev) =>
              prev?.filter((r) => r.permlink !== optimistic?.permlink) ?? []
      );

      error(...formatError(err));
    }
  });
}
