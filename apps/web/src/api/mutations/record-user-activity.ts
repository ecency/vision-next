import { useGlobalStore } from "@/core/global-store";
import { getAccessToken } from "@/utils";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { EcencyConfigManager } from "@/config";

export function useRecordUserActivity() {
  const activeUser = useGlobalStore((s) => s.activeUser);

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

        const params: Record<string, string | number | undefined> = {
          code: getAccessToken(activeUser.username),
          ty
        };

        if (bl) params.bl = bl;
        if (tx) params.tx = tx;

        return appAxios.post(apiBase(`/private-api/usr-activity`), params);
      }
    }
  );
}
