"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Draft, DraftMetadata } from "@/entities";
import i18next from "i18next";
import { success } from "@/features/shared";
import { QueryIdentifiers } from "@/core/react-query";
import {
  useAddDraftMutation,
  useDeleteDraftMutation
} from "@/api/sdk-mutations";

export function useCloneDraft(onSuccess: () => void) {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();
  const { mutateAsync: sdkAddDraft } = useAddDraftMutation();

  return useMutation({
    mutationKey: ["drafts", "clone"],
    mutationFn: async ({ item }: { item: Draft }) => {
      const { title, body, tags, meta } = item;
      const cloneTitle = i18next.t("g.copy") + " " + title;
      const draftMeta: DraftMetadata = meta!;
      return sdkAddDraft({ title: cloneTitle, body, tags, meta: draftMeta });
    },
    onSuccess: ({ drafts }) => {
      success(i18next.t("g.clone-success"));
      onSuccess();
      // Update web-specific cache key
      queryClient.setQueryData<Draft[]>(
        [QueryIdentifiers.DRAFTS, activeUser?.username],
        [...drafts]
      );
      // Also invalidate SDK cache key for consistency
      queryClient.invalidateQueries({
        queryKey: ["posts", "drafts", activeUser?.username]
      });
    }
  });
}

export function useDeleteDraft(onSuccess: (id: string) => void) {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();
  const { mutateAsync: sdkDeleteDraft } = useDeleteDraftMutation();

  return useMutation({
    mutationKey: ["drafts", "delete"],
    mutationFn: async ({ id }: { id: string }) => {
      await sdkDeleteDraft({ draftId: id });
      return id;
    },
    onSuccess: (id) => {
      success(i18next.t("g.delete-success"));
      onSuccess(id);
      // Update web-specific cache key
      queryClient.setQueryData<Draft[]>(
        [QueryIdentifiers.DRAFTS, activeUser?.username],
        (
          queryClient.getQueryData<Draft[]>([QueryIdentifiers.DRAFTS, activeUser?.username]) ?? []
        ).filter((draft) => draft._id !== id)
      );
      // Also invalidate SDK cache key for consistency
      queryClient.invalidateQueries({
        queryKey: ["posts", "drafts", activeUser?.username]
      });
    }
  });
}
