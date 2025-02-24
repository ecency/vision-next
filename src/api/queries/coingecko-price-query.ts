import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { ExternalWalletCurrency } from "@/enums";
import { getCGMarketApi } from "../coingecko-api";

export function getCoingeckoPriceQuery(currency?: ExternalWalletCurrency) {
  return EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.COINGECKO_PRICE, currency],
    queryFn: async () => {
      let curr = currency as string;
      switch (currency) {
        case ExternalWalletCurrency.BTC:
          curr = "binance-wrapped-btc";
          break;
        case ExternalWalletCurrency.ETH:
          curr = "ethereum";
          break;
        case ExternalWalletCurrency.SOL:
          curr = "solana";
          break;
        default:
          curr = currency as string;
      }
      const response = await getCGMarketApi(curr, "usd");
      const rate = +response[Object.keys(response)[0]].usd;
      return 1 / rate;
    },
    enabled: !!currency
  });
}
