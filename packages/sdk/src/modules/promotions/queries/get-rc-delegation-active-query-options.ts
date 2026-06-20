import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "../../core";

export interface RcDelegationActive {
  user: string;
  expires: Date;
}

/**
 * The active (ON) RC top-up for a user, if any. Lets the UI block a duplicate
 * purchase up front (only one RC top-up is allowed at a time). Returns null
 * when the user has no active top-up.
 */
export function getRcDelegationActiveQueryOptions(username: string, accessToken: string) {
  return queryOptions({
    queryKey: ["promotions", "rc-delegation-active", username],
    queryFn: async (): Promise<RcDelegationActive | null> => {
      if (!accessToken || !username) {
        return null;
      }

      const response = await fetch(CONFIG.privateApiHost + "/private-api/rc-delegation-active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: accessToken, username })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch RC delegation active: ${response.status}`);
      }

      const responseData = (await response.json()) as { user?: string; expires?: string };

      return responseData && responseData.expires
        ? { user: responseData.user as string, expires: new Date(responseData.expires) }
        : null;
    },
    enabled: !!username && !!accessToken
  });
}
