import {
  GeneralAssetInfo,
  getHbdAssetGeneralInfoQueryOptions,
  getHiveAssetGeneralInfoQueryOptions,
  getHiveEngineTokenGeneralInfoQueryOptions,
  getHiveEngineTokensBalancesQueryOptions,
  getHivePowerAssetGeneralInfoQueryOptions,
  getLarynxAssetGeneralInfoQueryOptions,
  getLarynxPowerAssetGeneralInfoQueryOptions,
  getPointsAssetGeneralInfoQueryOptions,
  getSpkAssetGeneralInfoQueryOptions,
} from "@/modules/assets";
import { getQueryClient, getCurrencyRate } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import {
  getAptAssetGeneralInfoQueryOptions,
  getBnbAssetGeneralInfoQueryOptions,
  getBtcAssetGeneralInfoQueryOptions,
  getEthAssetGeneralInfoQueryOptions,
  getSolAssetGeneralInfoQueryOptions,
  getTonAssetGeneralInfoQueryOptions,
  getTronAssetGeneralInfoQueryOptions,
} from "@/modules/assets/external";
import { getVisionPortfolioQueryOptions, VisionPortfolioResponse, VisionPortfolioWalletItem } from "./get-vision-portfolio-query-options";

interface Options {
  refetch: boolean;
  currency?: string;
}

export function getAccountWalletAssetInfoQueryOptions(
  username: string,
  asset: string,
  options: Options = { refetch: false }
) {
  // Helper function to handle both prefetch and refetch cases
  const queryClient = getQueryClient();
  const currency = options.currency ?? "usd";
  const fetchQuery = async (queryOptions: any) => {
    if (options.refetch) {
      await queryClient.fetchQuery(queryOptions);
    } else {
      await queryClient.prefetchQuery(queryOptions);
    }
    return queryClient.getQueryData<GeneralAssetInfo>(queryOptions.queryKey);
  };

  // Helper function to convert USD price to user's currency
  const convertPriceToUserCurrency = async (assetInfo: GeneralAssetInfo | undefined): Promise<GeneralAssetInfo | undefined> => {
    if (!assetInfo || currency === "usd") {
      return assetInfo;
    }

    try {
      // Get conversion rate from HBD to user's currency
      // Since HBD ≈ 1 USD, this gives us the USD to user's currency conversion rate
      const conversionRate = await getCurrencyRate(currency);

      return {
        ...assetInfo,
        price: assetInfo.price * conversionRate,
      };
    } catch (error) {
      // If conversion fails, return original USD price
      console.warn(`Failed to convert price from USD to ${currency}:`, error);
      return assetInfo;
    }
  };
  const portfolioQuery = getVisionPortfolioQueryOptions(username, currency);
  const getPortfolioAssetInfo = async () => {
    try {
      const portfolio: VisionPortfolioResponse = await queryClient.fetchQuery(portfolioQuery);
      const assetInfo = portfolio.wallets.find(
        (assetItem: VisionPortfolioWalletItem) => assetItem.symbol.toUpperCase() === asset.toUpperCase()
      );

      // Convert VisionPortfolioWalletItem (PortfolioItem from API) to GeneralAssetInfo
      if (!assetInfo) return undefined;

      // Build parts array from portfolio v2 fields
      const parts: Array<{ name: string; balance: number }> = [];

      if (assetInfo.liquid !== undefined && assetInfo.liquid !== null) {
        parts.push({ name: "liquid", balance: assetInfo.liquid });
      }

      if (assetInfo.staked !== undefined && assetInfo.staked !== null && assetInfo.staked > 0) {
        parts.push({ name: "staked", balance: assetInfo.staked });
      }

      if (assetInfo.savings !== undefined && assetInfo.savings !== null && assetInfo.savings > 0) {
        parts.push({ name: "savings", balance: assetInfo.savings });
      }

      // Extract delegation and power down data from extraData for HP
      if (assetInfo.extraData && Array.isArray(assetInfo.extraData)) {
        for (const extraItem of assetInfo.extraData) {
          if (!extraItem || typeof extraItem !== "object") continue;

          const dataKey = extraItem.dataKey;
          const value = extraItem.value;

          // Parse values from strings like "+ 7.645 HP", "- 1.293 HP", or "- 3,176.224 HP"
          if (typeof value === "string") {
            // Remove commas from formatted numbers like "3,176.224"
            const cleanValue = value.replace(/,/g, "");
            const match = cleanValue.match(/[+-]?\s*(\d+(?:\.\d+)?)/);
            if (match) {
              const numValue = Math.abs(Number.parseFloat(match[1]));

              if (dataKey === "delegated_hive_power") {
                parts.push({ name: "outgoing_delegations", balance: numValue });
              } else if (dataKey === "received_hive_power") {
                parts.push({ name: "incoming_delegations", balance: numValue });
              } else if (dataKey === "powering_down_hive_power") {
                parts.push({ name: "pending_power_down", balance: numValue });
              }
            }
          }
        }
      }

      return {
        name: assetInfo.symbol,
        title: assetInfo.name,
        price: assetInfo.fiatRate,
        accountBalance: assetInfo.balance,
        apr: assetInfo.apr?.toString(),
        layer: assetInfo.layer,
        pendingRewards: assetInfo.pendingRewards,
        parts,
      } as GeneralAssetInfo;
    } catch (e) {
      return undefined;
    }
  };

  return queryOptions({
    queryKey: ["ecency-wallets", "asset-info", username, asset, currency],
    queryFn: async () => {
      const portfolioAssetInfo = await getPortfolioAssetInfo();

      // Only use portfolio data if it has a valid price (> 0)
      // Portfolio API returns price=0 when fiatRate is missing, so we fall back to individual queries
      if (portfolioAssetInfo && portfolioAssetInfo.price > 0) {
        return portfolioAssetInfo;
      }

      // Fallback queries return USD prices, so we need to convert to user's currency
      let assetInfo: GeneralAssetInfo | undefined;

      if (asset === "HIVE") {
        assetInfo = await fetchQuery(getHiveAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HP") {
        assetInfo = await fetchQuery(getHivePowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HBD") {
        assetInfo = await fetchQuery(getHbdAssetGeneralInfoQueryOptions(username));
      } else if (asset === "SPK") {
        assetInfo = await fetchQuery(getSpkAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LARYNX") {
        assetInfo = await fetchQuery(getLarynxAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LP") {
        assetInfo = await fetchQuery(getLarynxPowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "POINTS") {
        assetInfo = await fetchQuery(getPointsAssetGeneralInfoQueryOptions(username));
      } else if (asset === "APT") {
        assetInfo = await fetchQuery(getAptAssetGeneralInfoQueryOptions(username));
      } else if (asset === "BNB") {
        assetInfo = await fetchQuery(getBnbAssetGeneralInfoQueryOptions(username));
      } else if (asset === "BTC") {
        assetInfo = await fetchQuery(getBtcAssetGeneralInfoQueryOptions(username));
      } else if (asset === "ETH") {
        assetInfo = await fetchQuery(getEthAssetGeneralInfoQueryOptions(username));
      } else if (asset === "SOL") {
        assetInfo = await fetchQuery(getSolAssetGeneralInfoQueryOptions(username));
      } else if (asset === "TON") {
        assetInfo = await fetchQuery(getTonAssetGeneralInfoQueryOptions(username));
      } else if (asset === "TRX") {
        assetInfo = await fetchQuery(getTronAssetGeneralInfoQueryOptions(username));
      } else {
        const balances = await queryClient.ensureQueryData(
          getHiveEngineTokensBalancesQueryOptions(username)
        );

        if (balances.some((balance) => balance.symbol === asset)) {
          assetInfo = await fetchQuery(
            getHiveEngineTokenGeneralInfoQueryOptions(username, asset)
          );
        } else {
          throw new Error(
            "[SDK][Wallets] – has requested unrecognized asset info"
          );
        }
      }

      // Convert USD price to user's currency
      return await convertPriceToUserCurrency(assetInfo);
    },
  });
}
