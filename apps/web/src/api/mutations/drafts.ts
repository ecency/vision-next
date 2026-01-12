"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Draft, DraftMetadata } from "@/entities";
import i18next from "i18next";
import { addDraft, deleteDraft } from "@ecency/sdk";
import { success } from "@/features/shared";
import { QueryIdentifiers } from "@/core/react-query";
import { getAccessToken } from "@/utils";

export function useCloneDraft(onSuccess: () => void) {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["drafts", "clone"],
    mutationFn: async ({ item }: { item: Draft }) => {
      const username = activeUser?.username;
      if (!username) {
        throw new Error("Cannot clone draft without an active user");
      }
      const token = getAccessToken(username);
      if (!token) {
        throw new Error("Missing access token for draft cloning");
      }
      const { title, body, tags, meta } = item;
      const cloneTitle = i18next.t("g.copy") + " " + title;
      const draftMeta: DraftMetadata = meta!;
      return addDraft(token, cloneTitle, body, tags, draftMeta);
    },
    onSuccess: ({ drafts }) => {
      success(i18next.t("g.clone-success"));
      onSuccess();
      queryClient.setQueryData<Draft[]>(
        [QueryIdentifiers.DRAFTS, activeUser?.username],
        [...drafts]
      );
    }
  });
}

export function useDeleteDraft(onSuccess: (id: string) => void) {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["drafts", "delete"],
    mutationFn: async ({ id }: { id: string }) => {
      const username = activeUser?.username;
      if (!username) {
        throw new Error("Cannot delete draft without an active user");
      }
      const token = getAccessToken(username);
      if (!token) {
        throw new Error("Missing access token for draft deletion");
      }
      await deleteDraft(token, id);
      return id;
    },
    onSuccess: (id) => {
      success(i18next.t("g.delete-success"));
      onSuccess(id);
      queryClient.setQueryData<Draft[]>(
        [QueryIdentifiers.DRAFTS, activeUser?.username],
        (
          queryClient.getQueryData<Draft[]>([QueryIdentifiers.DRAFTS, activeUser?.username]) ?? []
        ).filter((draft) => draft._id !== id)
      );
    }
  });
}
