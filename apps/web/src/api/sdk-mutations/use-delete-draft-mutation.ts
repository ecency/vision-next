"use client";

import { useDeleteDraft as useSdkDeleteDraft } from "@ecency/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";
import { getAccessToken } from "@/utils";

export function useDeleteDraftMutation() {
  const username = useActiveUsername();
  const code = username ? getAccessToken(username) : undefined;
  return useSdkDeleteDraft(username, code);
}
