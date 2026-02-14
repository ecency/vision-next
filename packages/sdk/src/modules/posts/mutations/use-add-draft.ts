import { useMutation } from "@tanstack/react-query";
import { getQueryClient } from "@/modules/core";
import { addDraft } from "@/modules/private-api/requests";
import { DraftMetadata } from "../types";

export function useAddDraft(
  username: string | undefined,
  code: string | undefined,
  onSuccess?: () => void,
  onError?: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["posts", "drafts", "add", username],
    mutationFn: async ({
      title,
      body,
      tags,
      meta,
    }: {
      title: string;
      body: string;
      tags: string;
      meta: DraftMetadata;
    }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] – missing auth for addDraft");
      }
      return addDraft(code, title, body, tags, meta);
    },
    onSuccess: (data) => {
      onSuccess?.();
      const qc = getQueryClient();
      // Set the full drafts list from the response (API returns complete list)
      if (data?.drafts) {
        qc.setQueryData(["posts", "drafts", username], data.drafts);
      } else {
        qc.invalidateQueries({ queryKey: ["posts", "drafts", username] });
      }
    },
    onError,
  });
}
