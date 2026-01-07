"use client";

import { usrActivity } from "@ecency/sdk";
import { EcencyConfigManager } from "@/config";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";

export function useRecordUserActivity() {
  const { activeUser } = useActiveAccount();

  return EcencyConfigManager.useConditionalMutation(
    ({ visionFeatures }) => visionFeatures.userActivityTracking.enabled,
    {
      mutationKey: ["recordUserActivity", activeUser?.username],
      mutationFn: async ({
        ty,
        bl = "",
        tx = ""
      }: {
        ty: number;
        bl?: string | number;
        tx?: string | number;
      }) => {
        if (!activeUser) {
          return;
        }

        await usrActivity(getAccessToken(activeUser.username), ty, bl, tx);
      }
    }
  );
}
