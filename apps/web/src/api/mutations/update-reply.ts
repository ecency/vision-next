import { useMutation } from "@tanstack/react-query";
import * as ss from "@/utils/session-storage";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { CommentOptions, Entry, MetaData } from "@/entities";
import { comment, formatError } from "@/api/operations";
import { error, success } from "@/features/shared";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useValidatePostUpdating } from "@/api/mutations/validate-post-updating";
import i18next from "i18next";

export function useUpdateReply(
  entry?: Entry | null,
  onSuccess?: () => Promise<void>,
  onBlockchainError?: (text: string, error: any) => void
) {
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

      const updatedEntry = {
        ...entry,
        json_metadata: jsonMeta,
        body: text
      };

      // Update cache immediately for instant feedback
      updateEntryQueryData([updatedEntry]);

      // Fire blockchain broadcast in background
      const draftKey = `reply_draft_${entry.author}_${entry.permlink}`;
      comment(
        activeUser.username,
        entry.parent_author ?? "",
        entry.parent_permlink ?? entry.category,
        entry.permlink,
        "",
        text,
        jsonMeta,
        options ?? null,
        point
      ).then(async (transactionResult) => {
        // Blockchain confirmed
        try {
          await validatePostUpdating({ entry, text });
          await onSuccess?.();
        } catch (e) {}

        // Only remove draft after blockchain confirms
        ss.remove(draftKey);
        success(i18next.t("g.updated"));
      }).catch((err) => {
        // Blockchain failed - revert to original entry
        updateEntryQueryData([entry]);

        // Notify parent component to restore text
        if (onBlockchainError) {
          onBlockchainError(text, err);
        }

        // Keep draft for retry
        const errorMessage = formatError(err);

        // Check if it's an RC error
        const errorString = JSON.stringify(err).toLowerCase();
        const isRCError = errorString.includes("rc") ||
                         errorString.includes("resource credit") ||
                         errorString.includes("bandwidth");

        if (isRCError) {
          error(errorMessage[0], i18next.t("comment.rc-error-hint"));
        } else {
          error(errorMessage[0], errorMessage[1] || i18next.t("comment.retry-hint"));
        }
      });

      // Return immediately for instant UI feedback
      return updatedEntry;
    },
    onSuccess: async (data) => {
      // Already handled in mutationFn
    },
    onError: (e) => {
      // Revert to original entry if sync error
      if (entry) {
        updateEntryQueryData([entry]);
      }
      error(...formatError(e));
    }
  });
}
