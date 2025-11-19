import { AssetOperation } from "@/modules/assets";
import { getQueryClient } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { getVisionPortfolioQueryOptions } from "./get-vision-portfolio-query-options";

export function getTokenOperationsQueryOptions(
  token: string,
  username: string,
  isForOwner = false
) {
  return queryOptions({
    queryKey: ["wallets", "token-operations", token, username, isForOwner],
    queryFn: async () => {
      const queryClient = getQueryClient();
      const normalizedToken = token.toUpperCase();

      if (!username) {
        return [] as AssetOperation[];
      }

      try {
        const portfolio = await queryClient.fetchQuery(
          getVisionPortfolioQueryOptions(username)
        );
        const assetEntry = portfolio.wallets.find(
          (assetItem) => assetItem.info.name === normalizedToken
        );

        return assetEntry?.operations ?? [];
      } catch {
        return [];
      }
    },
  });
}
