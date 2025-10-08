import {
  AssetOperation,
  getHiveEngineTokensBalancesQueryOptions,
  getHiveEngineTokensMetadataQueryOptions,
  HiveEngineTokenBalance,
  HiveEngineTokenMetadataResponse,
} from "@/modules/assets";
import { getQueryClient } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { EcencyWalletBasicTokens } from "../enums";

export function getTokenOperationsQueryOptions(
  token: string,
  username: string,
  isForOwner = false
) {
  return queryOptions({
    queryKey: ["wallets", "token-operations", token, username, isForOwner],
    queryFn: async () => {
      switch (token) {
        case EcencyWalletBasicTokens.Hive:
          return [
            AssetOperation.Transfer,
            ...(isForOwner
              ? [
                  AssetOperation.TransferToSavings,
                  AssetOperation.PowerUp,
                  AssetOperation.Swap,
                ]
              : []),
          ];
        case EcencyWalletBasicTokens.HivePower:
          return [
            AssetOperation.Delegate,
            ...(isForOwner
              ? [AssetOperation.PowerDown, AssetOperation.WithdrawRoutes]
              : [AssetOperation.PowerUp]),
          ];
        case EcencyWalletBasicTokens.HiveDollar:
          return [
            AssetOperation.Transfer,
            ...(isForOwner
              ? [AssetOperation.TransferToSavings, AssetOperation.Swap]
              : []),
          ];
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
        case EcencyWalletBasicTokens.Spk:
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

      const balancesListQuery =
        getHiveEngineTokensBalancesQueryOptions(username);
      await getQueryClient().prefetchQuery(balancesListQuery);
      const balances = getQueryClient().getQueryData<HiveEngineTokenBalance[]>(
        balancesListQuery.queryKey
      );

      const tokensQuery = getHiveEngineTokensMetadataQueryOptions(
        balances?.map((b) => b.symbol) ?? []
      );
      await getQueryClient().prefetchQuery(tokensQuery);
      const tokens = getQueryClient().getQueryData<
        HiveEngineTokenMetadataResponse[]
      >(tokensQuery.queryKey);

      const balanceInfo = balances?.find((m) => m.symbol === token);
      const tokenInfo = tokens?.find((t) => t.symbol === token);

      const canDelegate =
        isForOwner &&
        tokenInfo?.delegationEnabled &&
        balanceInfo &&
        parseFloat(balanceInfo.delegationsOut) !==
          parseFloat(balanceInfo.balance);
      const canUndelegate =
        isForOwner && parseFloat(balanceInfo?.delegationsOut ?? "0") > 0;

      const canStake = isForOwner && tokenInfo?.stakingEnabled;
      const canUnstake =
        isForOwner && parseFloat(balanceInfo?.stake ?? "0") > 0;
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
