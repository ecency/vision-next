import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { parsePrivateApiBalance } from "../common/parse-private-api-balance";

export function getSolAssetBalanceQueryOptions(address: string) {
  return queryOptions({
    queryKey: ["assets", "sol", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/sol/${encodeURIComponent(
        address
      )}`;

      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] – request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance(await response.json(), "sol")
          .balanceString;
      } catch (error) {
        console.error(error);

        const response = await fetch(`${baseUrl}?provider=chainz`);
        return +parsePrivateApiBalance(await response.json(), "sol")
          .balanceString;
      }
    },
  });
}
