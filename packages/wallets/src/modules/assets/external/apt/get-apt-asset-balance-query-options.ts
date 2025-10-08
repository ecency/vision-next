import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { parsePrivateApiBalance } from "../common/parse-private-api-balance";

export function getAptAssetBalanceQueryOptions(address: string) {
  return queryOptions({
    queryKey: ["assets", "apt", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/apt/${encodeURIComponent(
        address
      )}`;

      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] – request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance(await response.json(), "apt")
          .balanceString;
      } catch (error) {
        console.error(error);

        const response = await fetch(`${baseUrl}?provider=chainz`);
        return +parsePrivateApiBalance(await response.json(), "apt")
          .balanceString;
      }
    },
  });
}
