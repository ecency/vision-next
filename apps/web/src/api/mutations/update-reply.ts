import { useMutation } from "@tanstack/react-query";
import * as ss from "@/utils/session-storage";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { CommentOptions, Entry, MetaData } from "@/entities";
import { comment, formatError } from "@/api/operations";
import { error } from "@/features/shared";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useValidatePostUpdating } from "@/api/mutations/validate-post-updating";

export function useUpdateReply(entry?: Entry | null, onSuccess?: () => Promise<void>) {
  const { activeUser } = useActiveAccount();

  const { mutateAsync: validatePostUpdating } = useValidatePostUpdating();
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();

  return useMutation({
    mutationKey: ["reply-update", activeUser?.username, entry?.author, entry?.permlink],
    mutationFn: async ({
      text,
      jsonMeta,
      options,
      point
    }: {
      text: string;
      jsonMeta: MetaData;
      point: boolean;
      options?: CommentOptions;
    }) => {
      if (!activeUser || !entry) {
        throw new Error("[Reply][Update] – no active user provided");
      }

      await comment(
        activeUser.username,
        entry.parent_author ?? "",
        entry.parent_permlink ?? entry.category,
        entry.permlink,
        "",
        text,
        jsonMeta,
        options ?? null,
        point
      );
      try {
        await validatePostUpdating({ entry, text });
        await onSuccess?.();
      } catch (e) {}

      return {
        ...entry,
        json_metadata: jsonMeta,
        body: text
      };
    },
    onSuccess: (data) => {
      if (!entry) {
        return;
      }

      updateEntryQueryData([data]);

      // remove reply draft
      ss.remove(`reply_draft_${entry.author}_${entry.permlink}`);
    },
    onError: (e) => error(...formatError(e))
  });
}
