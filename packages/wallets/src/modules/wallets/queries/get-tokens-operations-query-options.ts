import {
  AssetOperation,
  Symbol as AssetSymbol,
  getHiveEngineTokensBalancesQueryOptions,
  getHiveEngineTokensMetadataQueryOptions,
  parseAsset,
} from "@/modules/assets";
import type { GeneralAssetInfo } from "@/modules/assets";
import { getAccountWalletAssetInfoQueryOptions } from "./get-account-wallet-asset-info-query-options";
import { CONFIG, getQueryClient } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { EcencyWalletBasicTokens } from "../enums";
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
      const portfolioOperations = await (async () => {
        if (!isForOwner || !username) {
          return undefined;
        }

        try {
          const portfolio = await queryClient.fetchQuery(
            getVisionPortfolioQueryOptions(username)
          );
          const assetEntry = portfolio.wallets.find(
            (assetItem) => assetItem.info.name === normalizedToken
          );

          if (assetEntry?.operations.length) {
            return assetEntry.operations;
          }
        } catch {
          return undefined;
        }

        return undefined;
      })();

      if (portfolioOperations && portfolioOperations.length > 0) {
        return portfolioOperations;
      }

      const ensureAssetInfo = async (): Promise<GeneralAssetInfo | undefined> => {
        if (!isForOwner || !username) {
          return undefined;
        }

        return (await queryClient.ensureQueryData(
          getAccountWalletAssetInfoQueryOptions(username, normalizedToken)
        )) as GeneralAssetInfo;
      };

      switch (normalizedToken) {
        case EcencyWalletBasicTokens.Hive: {
          const assetInfo = await ensureAssetInfo();
          const savingsBalance = assetInfo?.parts?.find(
            (part) => part.name === "savings"
          )?.balance;
          const pendingSavingsWithdrawAmount = await (async () => {
            if (!isForOwner || !username) {
              return 0;
            }

            try {
              const response = (await CONFIG.hiveClient.database.call(
                "get_savings_withdraw_from",
                [username]
              )) as { amount: string }[];

              return response.reduce((total, request) => {
                const parsed = parseAsset(request.amount);

                return parsed.symbol === AssetSymbol.HIVE
                  ? total + parsed.amount
                  : total;
              }, 0);
            } catch {
              return 0;
            }
          })();

          const hasAvailableSavingsWithdraw =
            typeof savingsBalance === "number" &&
            savingsBalance - pendingSavingsWithdrawAmount > 0.000001;

          return [
            AssetOperation.Transfer,
            ...(isForOwner
              ? [
                  ...(hasAvailableSavingsWithdraw
                    ? [AssetOperation.WithdrawFromSavings]
                    : []),
                  AssetOperation.TransferToSavings,
                  AssetOperation.PowerUp,
                  AssetOperation.Swap,
                ]
              : []),
          ];
        }
        case EcencyWalletBasicTokens.HivePower:
          return [
            AssetOperation.Delegate,
            ...(isForOwner
              ? [AssetOperation.PowerDown, AssetOperation.WithdrawRoutes]
              : [AssetOperation.PowerUp]),
          ];
        case EcencyWalletBasicTokens.HiveDollar: {
          const assetInfo = await ensureAssetInfo();
          const savingsBalance = assetInfo?.parts?.find(
            (part) => part.name === "savings"
          )?.balance;
          const pendingSavingsWithdrawAmount = await (async () => {
            if (!isForOwner || !username) {
              return 0;
            }

            try {
              const response = (await CONFIG.hiveClient.database.call(
                "get_savings_withdraw_from",
                [username]
              )) as { amount: string }[];

              return response.reduce((total, request) => {
                const parsed = parseAsset(request.amount);

                return parsed.symbol === AssetSymbol.HBD
                  ? total + parsed.amount
                  : total;
              }, 0);
            } catch {
              return 0;
            }
          })();

          const hasAvailableSavingsWithdraw =
            typeof savingsBalance === "number" &&
            savingsBalance - pendingSavingsWithdrawAmount > 0.000001;

          return [
            AssetOperation.Transfer,
            ...(isForOwner
              ? [
                  ...(hasAvailableSavingsWithdraw
                    ? [AssetOperation.WithdrawFromSavings]
                    : []),
                  AssetOperation.TransferToSavings,
                  AssetOperation.Swap,
                ]
              : []),
          ];
        }
        case EcencyWalletBasicTokens.Points:
          return [
            AssetOperation.Gift,
            ...(isForOwner
              ? [
                  AssetOperation.Promote,
                  AssetOperation.Claim,
                  AssetOperation.Buy,
                ]
              : []),
          ];
        case "SPK":
          return [AssetOperation.Transfer];
        case "LARYNX":
          return [
            AssetOperation.Transfer,
            ...(isForOwner
              ? [AssetOperation.PowerUp, AssetOperation.LockLiquidity]
              : []),
          ];
        case "LP":
          return [
            AssetOperation.Delegate,
            ...(isForOwner ? [AssetOperation.PowerDown] : []),
          ];
        case "APT":
        case "BNB":
        case "BTC":
        case "ETH":
        case "SOL":
        case "TON":
        case "TRX":
          return [];
      }

      if (!username) {
        return [AssetOperation.Transfer];
      }

      const balancesListQuery =
        getHiveEngineTokensBalancesQueryOptions(username);
      const balances = await queryClient.ensureQueryData(balancesListQuery);

      const tokensQuery = getHiveEngineTokensMetadataQueryOptions(
        balances.map((b) => b.symbol)
      );
      const tokens = await queryClient.ensureQueryData(tokensQuery);

      const balanceInfo = balances.find((m) => m.symbol === token);
      const tokenInfo = tokens.find((t) => t.symbol === token);

      const canDelegate =
        isForOwner &&
        tokenInfo?.delegationEnabled &&
        balanceInfo &&
        parseFloat(balanceInfo.delegationsOut) !==
          parseFloat(balanceInfo.balance);
      const canUndelegate =
        isForOwner && parseFloat(balanceInfo?.delegationsOut ?? "0") > 0;

      const stakeBalance = parseFloat(balanceInfo?.stake ?? "0");
      const pendingUnstakeBalance = parseFloat(
        balanceInfo?.pendingUnstake ?? "0"
      );

      const supportsStakingFeature = Boolean(
        tokenInfo?.stakingEnabled ||
          (tokenInfo?.unstakingCooldown ?? 0) > 0 ||
          parseFloat(tokenInfo?.totalStaked ?? "0") > 0
      );
      const hasStakingBalances =
        stakeBalance > 0 || pendingUnstakeBalance > 0;

      const canStake = isForOwner && Boolean(tokenInfo?.stakingEnabled);
      const canUnstake =
        isForOwner &&
        (supportsStakingFeature || hasStakingBalances);
      return [
        AssetOperation.Transfer,
        ...(canDelegate ? [AssetOperation.Delegate] : []),
        ...(canUndelegate ? [AssetOperation.Undelegate] : []),
        ...(canStake ? [AssetOperation.Stake] : []),
        ...(canUnstake ? [AssetOperation.Unstake] : []),
      ];
    },
  });
}
