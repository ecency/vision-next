import { useQuery } from "@tanstack/react-query";
import { MarketAsset, isHiveMarketAsset } from "../market-pair";
import { useGlobalStore } from "@/core/global-store";
import { QueryIdentifiers } from "@/core/react-query";
import { getCurrencyTokenRate } from "@ecency/sdk";

export function useCurrencyRateQuery(fromAsset: MarketAsset, toAsset: MarketAsset) {
  const currency = useGlobalStore((s) => s.currency);
  const enabled = isHiveMarketAsset(fromAsset) && isHiveMarketAsset(toAsset);
  /**
   * Show value till 2 digits in fraction
   * @param value – source
   * @returns formatted number
   */
  const formatTillPresentDigits = (value: number) => {
    const magnitude = -Math.floor(Math.log10(value) + 1);
    return +value.toFixed(magnitude + 2);
  };

  return useQuery({
    queryKey: [QueryIdentifiers.SWAP_FORM_CURRENCY_RATE, currency, fromAsset, toAsset],
    queryFn: async () => {
      const fromAccountRate = await getCurrencyTokenRate(currency, fromAsset);
      const toAccountRate = await getCurrencyTokenRate(currency, toAsset);
      return [formatTillPresentDigits(fromAccountRate), formatTillPresentDigits(toAccountRate)];
    },
    enabled,
    refetchInterval: enabled ? 30000 : false
  });
}
