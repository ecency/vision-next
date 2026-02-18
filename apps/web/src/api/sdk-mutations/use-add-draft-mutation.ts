"use client";

import { useAddDraft as useSdkAddDraft } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";

export function useAddDraftMutation() {
  const { activeUser } = useActiveAccount();
  const code = activeUser ? getAccessToken(activeUser.username) : undefined;
  return useSdkAddDraft(activeUser?.username, code);
}
