import { getQueryClient } from "@/modules/core";
import { getCurrencyRate } from "@/modules/market";
import { queryOptions } from "@tanstack/react-query";
import type { GeneralAssetInfo } from "../types";
import { getHiveAssetGeneralInfoQueryOptions } from "./get-hive-asset-general-info-query-options";
import { getHbdAssetGeneralInfoQueryOptions } from "./get-hbd-asset-general-info-query-options";
import { getHivePowerAssetGeneralInfoQueryOptions } from "./get-hive-power-asset-general-info-query-options";
import { getHiveEngineTokensBalancesQueryOptions } from "@/modules/hive-engine/queries";
import { getHiveEngineTokenGeneralInfoQueryOptions } from "@/modules/hive-engine/queries";
import { getSpkAssetGeneralInfoQueryOptions } from "@/modules/spk/queries";
import { getLarynxAssetGeneralInfoQueryOptions } from "@/modules/spk/queries";
import { getLarynxPowerAssetGeneralInfoQueryOptions } from "@/modules/spk/queries";
import { getPointsAssetGeneralInfoQueryOptions } from "@/modules/points/queries";
import {
  getPortfolioQueryOptions,
  type PortfolioResponse,
  type PortfolioWalletItem,
} from "./get-portfolio-query-options";

interface Options {
  refetch?: boolean;
  currency?: string;
}

export function getAccountWalletAssetInfoQueryOptions(
  username: string,
  asset: string,
  options: Options = { refetch: false }
) {
  const queryClient = getQueryClient();
  const currency = options.currency ?? "usd";

  const fetchQuery = async (qo: any) => {
    if (options.refetch) {
      await queryClient.fetchQuery(qo);
    } else {
      await queryClient.prefetchQuery(qo);
    }
    return queryClient.getQueryData<GeneralAssetInfo>(qo.queryKey);
  };

  const convertPriceToUserCurrency = async (
    assetInfo: GeneralAssetInfo | undefined
  ): Promise<GeneralAssetInfo | undefined> => {
    if (!assetInfo || currency === "usd") {
      return assetInfo;
    }

    try {
      const conversionRate = await getCurrencyRate(currency);
      return {
        ...assetInfo,
        price: assetInfo.price * conversionRate,
      };
    } catch (error) {
      console.warn(`Failed to convert price from USD to ${currency}:`, error);
      return assetInfo;
    }
  };

  const portfolioQuery = getPortfolioQueryOptions(username, currency, true);

  const getPortfolioAssetInfo = async () => {
    try {
      const portfolio: PortfolioResponse = await queryClient.fetchQuery(portfolioQuery);
      const assetItem = portfolio.wallets.find(
        (item: PortfolioWalletItem) =>
          item.symbol.toUpperCase() === asset.toUpperCase()
      );

      if (!assetItem) return undefined;

      const parts: Array<{ name: string; balance: number }> = [];

      if (assetItem.liquid !== undefined && assetItem.liquid !== null) {
        parts.push({ name: "liquid", balance: assetItem.liquid });
      }

      if (assetItem.staked !== undefined && assetItem.staked !== null && assetItem.staked > 0) {
        parts.push({ name: "staked", balance: assetItem.staked });
      }

      if (assetItem.savings !== undefined && assetItem.savings !== null && assetItem.savings > 0) {
        parts.push({ name: "savings", balance: assetItem.savings });
      }

      if (assetItem.extraData && Array.isArray(assetItem.extraData)) {
        for (const extraItem of assetItem.extraData) {
          if (!extraItem || typeof extraItem !== "object") continue;

          const dataKey = extraItem.dataKey;
          const value = extraItem.value;

          if (typeof value === "string") {
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
        name: assetItem.symbol,
        title: assetItem.name,
        price: assetItem.fiatRate,
        accountBalance: assetItem.balance,
        apr: assetItem.apr?.toString(),
        layer: assetItem.layer,
        pendingRewards: assetItem.pendingRewards,
        parts,
      } as GeneralAssetInfo;
    } catch {
      return undefined;
    }
  };

  return queryOptions({
    queryKey: ["ecency-wallets", "asset-info", username, asset, currency],
    queryFn: async () => {
      const portfolioAssetInfo = await getPortfolioAssetInfo();

      if (portfolioAssetInfo) {
        return portfolioAssetInfo;
      }

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
      } else {
        // Check if it's a Hive Engine token
        const balances = await queryClient.ensureQueryData(
          getHiveEngineTokensBalancesQueryOptions(username)
        );

        if (balances.some((balance) => balance.symbol === asset)) {
          assetInfo = await fetchQuery(
            getHiveEngineTokenGeneralInfoQueryOptions(username, asset)
          );
        } else {
          throw new Error(
            `[SDK][Wallet] – unrecognized asset "${asset}"`
          );
        }
      }

      return await convertPriceToUserCurrency(assetInfo);
    },
  });
}
