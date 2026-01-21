import { useMutation } from "@tanstack/react-query";
import { getQueryClient } from "@/modules/core";
import { deleteDraft } from "@/modules/private-api/requests";

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
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: ["posts", "drafts", username],
      });
    },
    onError,
  });
}
