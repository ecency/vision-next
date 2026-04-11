import { useMutation } from "@tanstack/react-query";
import { getQueryClient, QueryKeys } from "@/modules/core";
import { updateDraft } from "@/modules/private-api/requests";
import { DraftMetadata } from "../types";

export function useUpdateDraft(
  username: string | undefined,
  code: string | undefined,
  onSuccess?: () => void,
  onError?: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["posts", "drafts", "update", username],
    mutationFn: async ({
      draftId,
      title,
      body,
      tags,
      meta,
    }: {
      draftId: string;
      title: string;
      body: string;
      tags: string;
      meta: DraftMetadata;
    }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] – missing auth for updateDraft");
      }
      return updateDraft(code, draftId, title, body, tags, meta);
    },
    onSuccess: () => {
      onSuccess?.();
      const qc = getQueryClient();
      qc.invalidateQueries({ queryKey: QueryKeys.posts.drafts(username) });
      qc.invalidateQueries({ queryKey: QueryKeys.posts.draftsInfinite(username) });
    },
    onError,
  });
}
