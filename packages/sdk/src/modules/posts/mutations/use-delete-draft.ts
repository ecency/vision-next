import { InfiniteData, useMutation } from "@tanstack/react-query";
import { getQueryClient, QueryKeys } from "@/modules/core";
import { deleteDraft } from "@/modules/private-api/requests";
import type { Draft } from "../types";
import type { WrappedResponse } from "@/modules/core/types";

export function useDeleteDraft(
  username: string | undefined,
  code: string | undefined,
  onSuccess?: () => void,
  onError?: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["posts", "drafts", "delete", username],
    mutationFn: async ({ draftId }: { draftId: string }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] – missing auth for deleteDraft");
      }
      return deleteDraft(code, draftId);
    },
    onMutate: async ({ draftId }) => {
      const qc = getQueryClient();
      const listKey = QueryKeys.posts.drafts(username);

      await qc.cancelQueries({ queryKey: ["posts", "drafts", username] });

      const previousList = qc.getQueryData<Draft[]>(listKey);
      if (previousList) {
        qc.setQueryData<Draft[]>(
          listKey,
          previousList.filter((d) => d._id !== draftId)
        );
      }

      // Also update infinite query caches
      const infiniteQueries = qc.getQueriesData<InfiniteData<WrappedResponse<Draft>>>({
        queryKey: ["posts", "drafts", "infinite", username],
      });
      const previousInfinite = new Map(infiniteQueries);
      for (const [key, data] of infiniteQueries) {
        if (data) {
          qc.setQueryData(key, {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              data: page.data.filter((d) => d._id !== draftId),
            })),
          });
        }
      }

      return { previousList, previousInfinite };
    },
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: ["posts", "drafts", username],
      });
    },
    onError: (err, _variables, context) => {
      const qc = getQueryClient();
      if (context?.previousList) {
        qc.setQueryData(QueryKeys.posts.drafts(username), context.previousList);
      }
      if (context?.previousInfinite) {
        for (const [key, data] of context.previousInfinite) {
          qc.setQueryData(key, data);
        }
      }
      onError?.(err);
    },
  });
}
