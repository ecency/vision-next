"use client";

import { useDeleteDraft as useSdkDeleteDraft } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";

export function useDeleteDraftMutation() {
  const { activeUser } = useActiveAccount();
  const code = activeUser ? getAccessToken(activeUser.username) : undefined;
  return useSdkDeleteDraft(activeUser?.username, code);
}
