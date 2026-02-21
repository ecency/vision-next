import { ConfigManager } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { parsePrivateApiBalance } from "../common/parse-private-api-balance";

export function getAptAssetBalanceQueryOptions(address: string) {
  return queryOptions({
    queryKey: ["assets", "apt", "balance", address],
    queryFn: async () => {
      const baseUrl = `${ConfigManager.getValidatedBaseUrl()}/private-api/balance/apt/${encodeURIComponent(
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
        if (!response.ok) {
          throw new Error(
            `[SDK][Wallets] – fallback request failed(${response.status} ${response.statusText})`
          );
        }
        return +parsePrivateApiBalance(await response.json(), "apt")
          .balanceString;
      }
    },
  });
}
