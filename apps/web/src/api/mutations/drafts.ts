"use client";

import { useMutation } from "@tanstack/react-query";
import { Draft, DraftMetadata } from "@/entities";
import i18next from "i18next";
import { success } from "@/features/shared";
import {
  useAddDraftMutation,
  useDeleteDraftMutation
} from "@/api/sdk-mutations";

export function useCloneDraft(onSuccess: () => void) {
  const { mutateAsync: sdkAddDraft } = useAddDraftMutation();

  return useMutation({
    mutationKey: ["drafts", "clone"],
    mutationFn: async ({ item }: { item: Draft }) => {
      const { title, body, tags, meta } = item;
      const cloneTitle = i18next.t("g.copy") + " " + title;
      const draftMeta: DraftMetadata = meta!;
      return sdkAddDraft({ title: cloneTitle, body, tags, meta: draftMeta });
    },
    onSuccess: () => {
      success(i18next.t("g.clone-success"));
      onSuccess();
    }
  });
}

export function useDeleteDraft(onSuccess: (id: string) => void) {
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
    }
  });
}
