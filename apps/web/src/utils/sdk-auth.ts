import type { AuthContextV2 } from "@ecency/sdk";
import type { User } from "@/entities";
import { getWebBroadcastAdapter } from "@/providers/sdk";

export function getSdkAuthContext(user?: User): AuthContextV2 | undefined {
  if (!user) {
    return undefined;
  }

  return {
    accessToken: user.accessToken,
    postingKey: user.postingKey,
    loginType: user.loginType,
    adapter: getWebBroadcastAdapter(),
  };
}
