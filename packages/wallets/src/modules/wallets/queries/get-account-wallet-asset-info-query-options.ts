import {
  GeneralAssetInfo,
  getHbdAssetGeneralInfoQueryOptions,
  getHiveAssetGeneralInfoQueryOptions,
  getHiveEngineTokenGeneralInfoQueryOptions,
  getHivePowerAssetGeneralInfoQueryOptions,
  getLarynxAssetGeneralInfoQueryOptions,
  getLarynxPowerAssetGeneralInfoQueryOptions,
  getPointsAssetGeneralInfoQueryOptions,
  getSpkAssetGeneralInfoQueryOptions,
} from "@/modules/assets";
import { getQueryClient } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { HiveEngineTokens } from "../consts";
import {
  getAptAssetGeneralInfoQueryOptions,
  getBnbAssetGeneralInfoQueryOptions,
  getBtcAssetGeneralInfoQueryOptions,
  getEthAssetGeneralInfoQueryOptions,
  getSolAssetGeneralInfoQueryOptions,
  getTonAssetGeneralInfoQueryOptions,
  getTronAssetGeneralInfoQueryOptions,
} from "@/modules/assets/external";

interface Options {
  refetch: boolean;
}

export function getAccountWalletAssetInfoQueryOptions(
  username: string,
  asset: string,
  options: Options = { refetch: false }
) {
  // Helper function to handle both prefetch and refetch cases
  const fetchQuery = async (queryOptions: any) => {
    if (options.refetch) {
      await getQueryClient().fetchQuery(queryOptions);
    } else {
      await getQueryClient().prefetchQuery(queryOptions);
    }
    return getQueryClient().getQueryData<GeneralAssetInfo>(
      queryOptions.queryKey
    );
  };

  return queryOptions({
    queryKey: ["ecency-wallets", "asset-info", username, asset],
    queryFn: async () => {
      if (asset === "HIVE") {
        return fetchQuery(getHiveAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HP") {
        return fetchQuery(getHivePowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HBD") {
        return fetchQuery(getHbdAssetGeneralInfoQueryOptions(username));
      } else if (asset === "SPK") {
        return fetchQuery(getSpkAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LARYNX") {
        return fetchQuery(getLarynxAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LP") {
        return fetchQuery(getLarynxPowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "POINTS") {
        return fetchQuery(getPointsAssetGeneralInfoQueryOptions(username));
      } else if (asset === "APT") {
        return fetchQuery(getAptAssetGeneralInfoQueryOptions(username));
      } else if (asset === "BNB") {
        return fetchQuery(getBnbAssetGeneralInfoQueryOptions(username));
      } else if (asset === "BTC") {
        return fetchQuery(getBtcAssetGeneralInfoQueryOptions(username));
      } else if (asset === "ETH") {
        return fetchQuery(getEthAssetGeneralInfoQueryOptions(username));
      } else if (asset === "SOL") {
        return fetchQuery(getSolAssetGeneralInfoQueryOptions(username));
      } else if (asset === "TON") {
        return fetchQuery(getTonAssetGeneralInfoQueryOptions(username));
      } else if (asset === "TRX") {
        return fetchQuery(getTronAssetGeneralInfoQueryOptions(username));
      } else if (HiveEngineTokens.includes(asset)) {
        return await fetchQuery(
          getHiveEngineTokenGeneralInfoQueryOptions(username, asset)
        );
      } else {
        throw new Error(
          "[SDK][Wallets] – has requested unrecognized asset info"
        );
      }
    },
  });
}
