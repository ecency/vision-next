import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "../../core";

export interface BoostPlusAccountPrice {
  account: string;
  expires: Date;
}

export function getBoostPlusAccountPricesQueryOptions(account: string, accessToken: string) {
  return queryOptions({
    queryKey: ["promotions", "boost-plus-accounts", account],
    queryFn: async (): Promise<BoostPlusAccountPrice | null> => {
      if (!accessToken || !account) {
        return null;
      }

      const response = await fetch(CONFIG.privateApiHost + "/private-api/boosted-plus-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: accessToken, account }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch boost plus account prices: ${response.status}`);
      }

      const responseData = await response.json() as {
        expires: string;
        account: string;
      };

      return responseData
        ? {
            account: responseData.account,
            expires: new Date(responseData.expires)
          }
        : null;
    },
    enabled: !!account && !!accessToken
  });
}
