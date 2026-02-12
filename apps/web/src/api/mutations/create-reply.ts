// src/api/mutations/create-reply.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError } from "../operations";
import { Entry, FullAccount, MetaData, CommentOptions } from "@/entities";
import { tempEntry } from "@/utils";
import { QueryIdentifiers } from "@/core/react-query";
import { SortOrder } from "@/enums";
import { error, success } from "@/features/shared";
import * as ss from "@/utils/session-storage";
import i18next from "i18next";
import { getAccountRcQueryOptions } from "@ecency/sdk";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useCommentMutation } from "@/api/sdk-mutations";
import type { CommentPayload } from "@ecency/sdk";

export function useCreateReply(
  entry: Entry,
  root: Entry,
  onSuccess?: () => void,
  onBlockchainError?: (text: string, error: any) => void
) {
  const { activeUser, account } = useActiveAccount();
  const queryClient = useQueryClient();
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();
  const { addReply } = EcencyEntriesCacheManagement.useAddReply(entry);

  // Get SDK mutation (will be called in fire-and-forget mode)
  const { mutateAsync: sdkComment } = useCommentMutation();

  // Helper to generate discussions cache key (used in 4 places: onMutate, .then(), .catch(), onError)
  // Only handles SortOrder.created for fast-path optimistic updates
  // SDK's predicate-based invalidation handles ALL sort orders via partial key matching
  const getDiscussionsCacheKey = () =>
    [
      "posts",
      "discussions",
      root.author,
      root.permlink,
      SortOrder.created,
      activeUser?.username,
    ] as const;

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
      if (!activeUser || !account || !entry) throw new Error("Missing active user or entry");

      const optimisticEntry = tempEntry({
        author: account,
        permlink,
        parentAuthor: entry.author,
        parentPermlink: entry.permlink,
        title: "",
        body: text,
        tags: [],
        description: null
      });

      // Fire blockchain broadcast in background without blocking
      const draftKey = `reply_draft_${entry.author}_${entry.permlink}`;

      // Build SDK comment payload
      const commentPayload: CommentPayload = {
        author: activeUser.username,
        permlink,
        parentAuthor: entry.author,
        parentPermlink: entry.permlink,
        title: "",
        body: text,
        jsonMetadata: jsonMeta,
        // Pass root post info for discussions cache invalidation (nested replies)
        rootAuthor: root.author,
        rootPermlink: root.permlink,
      };

      // Add options if provided
      if (options) {
        // Extract beneficiaries defensively from extensions array
        const extractBeneficiaries = (extensions: any[]): Array<{ account: string; weight: number }> => {
          if (!Array.isArray(extensions)) return [];

          for (const ext of extensions) {
            if (Array.isArray(ext) && ext[1]?.beneficiaries) {
              return ext[1].beneficiaries.map((b: any) => ({
                account: b.account,
                weight: b.weight,
              }));
            }
          }
          return [];
        };

        commentPayload.options = {
          maxAcceptedPayout: options.max_accepted_payout,
          percentHbd: options.percent_hbd,
          allowVotes: options.allow_votes,
          allowCurationRewards: options.allow_curation_rewards,
          beneficiaries: extractBeneficiaries(options.extensions),
        };
      }

      // Use SDK mutation for blockchain broadcast (fire-and-forget)
      sdkComment(commentPayload)
        .then((transactionResult) => {
          // Blockchain confirmed - manually flip is_optimistic flag in discussions cache
          // This provides immediate feedback while SDK invalidation refetches
          queryClient.setQueryData<Entry[]>(
            getDiscussionsCacheKey(),
            (prev) =>
              prev?.map((r) =>
                r.permlink === permlink ? { ...r, is_optimistic: false } : r
              ) ?? []
          );

          updateEntryQueryData([optimisticEntry]);

          // Only remove draft after blockchain confirms
          ss.remove(draftKey);

          // Note: SDK handles cache invalidations (RC, discussions, entry)
          success(i18next.t("comment.success"));
        })
        .catch((err) => {
        // Blockchain failed - remove optimistic entry
        queryClient.setQueryData<Entry[]>(
          getDiscussionsCacheKey(),
          (prev) =>
            prev?.filter((r) => r.permlink !== permlink) ?? []
        );

        // Notify parent component to restore text to input
        if (onBlockchainError) {
          onBlockchainError(text, err);
        }

        // Keep draft in storage so user can retry by clicking Reply again
        // Draft is still available from before, just don't delete it
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
      return optimisticEntry;
    },

    onMutate: async ({ permlink, text }) => {
      if (!activeUser || !account) return;

      // Note: This creates a separate tempEntry from mutationFn (intentional)
      // This entry gets is_optimistic = true for discussions cache
      // mutationFn's entry is used for entry cache after blockchain confirms
      const optimistic = tempEntry({
        author: account,
        permlink,
        parentAuthor: entry.author,
        parentPermlink: entry.permlink,
        title: "",
        body: text,
        tags: [],
        description: null
      });
      optimistic.is_optimistic = true;

      // Add optimistic entry to cache immediately
      queryClient.setQueryData<Entry[]>(
          getDiscussionsCacheKey(),
          (prev = []) => [optimistic, ...prev]
      );

      return { optimistic, text };
    },

    onSuccess: (realEntry) => {
      // Mutation succeeded (returned temp entry immediately)
      // Actual blockchain confirmation happens in background
      onSuccess?.();
    },

    onError: (err, variables, context) => {
      // Only fires if mutationFn throws synchronously (rare)
      const { optimistic } = context ?? {};

      if (optimistic) {
        queryClient.setQueryData<Entry[]>(
            getDiscussionsCacheKey(),
            (prev) =>
                prev?.filter((r) => r.permlink !== optimistic?.permlink) ?? []
        );
      }

      error(...formatError(err));
    }
  });
}
