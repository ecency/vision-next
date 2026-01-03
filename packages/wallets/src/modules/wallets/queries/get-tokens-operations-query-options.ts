import { AssetOperation } from "@/modules/assets";
import { getQueryClient } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { getVisionPortfolioQueryOptions } from "./get-vision-portfolio-query-options";

function normalizePartKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function hasNonZeroSavingsBalance(
  parts: { name: string; balance: number }[] | undefined
) {
  return Boolean(
    parts?.some(
      (part) =>
        normalizePartKey(part.name) === "savings" && Number(part.balance) > 0
    )
  );
}

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

        if (!assetEntry) {
          return [] as AssetOperation[];
        }

        const operations = assetEntry.operations ?? [];
        const isHiveOrHbd = ["HIVE", "HBD"].includes(
          assetEntry.info.name.toUpperCase()
        );

        if (
          isHiveOrHbd &&
          !hasNonZeroSavingsBalance(assetEntry.info.parts)
        ) {
          return operations.filter(
            (operation) => operation !== AssetOperation.WithdrawFromSavings
          );
        }

        return operations;
      } catch {
        return [];
      }
    },
  });
}
