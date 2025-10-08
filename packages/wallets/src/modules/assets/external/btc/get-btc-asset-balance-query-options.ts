import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { parsePrivateApiBalance } from "../common/parse-private-api-balance";

export function getBtcAssetBalanceQueryOptions(address: string) {
  return queryOptions({
    queryKey: ["assets", "btc", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/btc/${encodeURIComponent(
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
        return +parsePrivateApiBalance(await response.json(), "btc")
          .balanceString;
      }
    },
  });
}
