import { ConfigManager } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { parsePrivateApiBalance } from "../common/parse-private-api-balance";

export function getBtcAssetBalanceQueryOptions(address: string) {
  return queryOptions({
    queryKey: ["assets", "btc", "balance", address],
    queryFn: async () => {
      const baseUrl = `${ConfigManager.getValidatedBaseUrl()}/private-api/balance/btc/${encodeURIComponent(
        address
      )}`;

      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] – request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance(await response.json(), "btc")
          .balanceString;
      } catch (error) {
        console.error(error);

        const response = await fetch(`${baseUrl}?provider=chainz`);
        if (!response.ok) {
          throw new Error(
            `[SDK][Wallets] – fallback request failed(${response.status} ${response.statusText})`
          );
        }
        return +parsePrivateApiBalance(await response.json(), "btc")
          .balanceString;
      }
    },
  });
}
