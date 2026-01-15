import { AssetOperation } from "@/modules/assets";
import { getQueryClient } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { getVisionPortfolioQueryOptions } from "./get-vision-portfolio-query-options";

export function getTokenOperationsQueryOptions(
  token: string,
  username: string,
  isForOwner = false,
  currency: string = "usd"
) {
  return queryOptions({
    queryKey: ["wallets", "token-operations", token, username, isForOwner, currency],
    queryFn: async () => {
      const queryClient = getQueryClient();
      const normalizedToken = token.toUpperCase();

      if (!username) {
        return [] as AssetOperation[];
      }

      try {
        const portfolio = await queryClient.fetchQuery(
          getVisionPortfolioQueryOptions(username, currency)
        );
        const assetEntry = portfolio.wallets.find(
          (assetItem) => assetItem.symbol.toUpperCase() === normalizedToken
        );

        if (!assetEntry) {
          return [] as AssetOperation[];
        }

        // Extract action IDs and map to AssetOperation enums
        const rawActions = assetEntry.actions ?? [];
        const operations: AssetOperation[] = rawActions
          .map((action) => {
            // Extract the id field from action object
            if (typeof action === "string") return action;
            if (action && typeof action === "object") {
              const record = action as Record<string, unknown>;
              return (record.id ?? record.code ?? record.name ?? record.action) as string | undefined;
            }
            return undefined;
          })
          .filter((id): id is string => Boolean(id))
          .map((id) => {
            // Normalize: underscores to hyphens, lowercase
            const canonical = id.trim().toLowerCase().replace(/[\s_]+/g, "-");

            // Primary mapping: API action IDs to AssetOperation enum values
            const aliasMap: Record<string, AssetOperation> = {
              // Common operations
              "transfer": AssetOperation.Transfer,
              "ecency-point-transfer": AssetOperation.Transfer,
              "spkcc-spk-send": AssetOperation.Transfer,

              // Savings operations
              "transfer-to-savings": AssetOperation.TransferToSavings,
              "transfer-savings": AssetOperation.TransferToSavings,
              "savings-transfer": AssetOperation.TransferToSavings,
              "withdraw-from-savings": AssetOperation.WithdrawFromSavings,
              "transfer-from-savings": AssetOperation.WithdrawFromSavings,
              "withdraw-savings": AssetOperation.WithdrawFromSavings,
              "savings-withdraw": AssetOperation.WithdrawFromSavings,

              // Vesting/Power operations
              "transfer-to-vesting": AssetOperation.PowerUp,
              "powerup": AssetOperation.PowerUp,
              "power-up": AssetOperation.PowerUp,
              "withdraw-vesting": AssetOperation.PowerDown,
              "power-down": AssetOperation.PowerDown,
              "powerdown": AssetOperation.PowerDown,

              // Delegation
              "delegate": AssetOperation.Delegate,
              "delegate-vesting-shares": AssetOperation.Delegate,
              "hp-delegate": AssetOperation.Delegate,
              "delegate-hp": AssetOperation.Delegate,
              "delegate-power": AssetOperation.Delegate,
              "undelegate": AssetOperation.Undelegate,
              "undelegate-power": AssetOperation.Undelegate,
              "undelegate-token": AssetOperation.Undelegate,

              // Staking (Layer 2)
              "stake": AssetOperation.Stake,
              "stake-token": AssetOperation.Stake,
              "stake-power": AssetOperation.Stake,
              "unstake": AssetOperation.Unstake,
              "unstake-token": AssetOperation.Unstake,
              "unstake-power": AssetOperation.Unstake,

              // Swap/Convert
              "swap": AssetOperation.Swap,
              "swap-token": AssetOperation.Swap,
              "swap-tokens": AssetOperation.Swap,
              "convert": AssetOperation.Convert,

              // Points operations
              "promote": AssetOperation.Promote,
              "promote-post": AssetOperation.Promote,
              "promote-entry": AssetOperation.Promote,
              "boost": AssetOperation.Promote,
              "gift": AssetOperation.Gift,
              "gift-points": AssetOperation.Gift,
              "points-gift": AssetOperation.Gift,
              "claim": AssetOperation.Claim,
              "claim-rewards": AssetOperation.Claim,
              "claim-points": AssetOperation.Claim,
              "buy": AssetOperation.Buy,
              "buy-points": AssetOperation.Buy,

              // Other
              "claim-interest": AssetOperation.ClaimInterest,
              "withdraw-routes": AssetOperation.WithdrawRoutes,
              "withdrawroutes": AssetOperation.WithdrawRoutes,
              "lock": AssetOperation.LockLiquidity,
              "lock-liquidity": AssetOperation.LockLiquidity,
              "lock-liq": AssetOperation.LockLiquidity,
            };

            // Check alias map first (primary method)
            const mapped = aliasMap[canonical];
            if (mapped) return mapped;

            // Fallback: try direct enum value match (for exact matches like "transfer", "promote")
            const directMatch = Object.values(AssetOperation).find(
              (op) => op.toLowerCase() === canonical
            );
            return directMatch;
          })
          .filter((op): op is AssetOperation => Boolean(op))
          // Remove duplicates - API may return multiple actions that map to same operation
          .filter((op, index, self) => self.indexOf(op) === index);

        const isHiveOrHbd = ["HIVE", "HBD"].includes(normalizedToken);
        // Check if there's a non-zero savings balance
        const rawToken = assetEntry as any;
        const hasSavings = Number(rawToken.savings ?? 0) > 0;

        if (
          isHiveOrHbd &&
          !hasSavings
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
