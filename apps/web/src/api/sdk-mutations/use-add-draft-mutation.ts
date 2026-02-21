"use client";

import { useAddDraft as useSdkAddDraft } from "@ecency/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";
import { getAccessToken } from "@/utils";

export function useAddDraftMutation() {
  const username = useActiveUsername();
  const code = username ? getAccessToken(username) : undefined;
  return useSdkAddDraft(username, code);
}
