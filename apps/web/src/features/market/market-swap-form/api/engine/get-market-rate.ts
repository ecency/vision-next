import Decimal from "decimal.js";

import { getHiveEngineOrderBook } from "@ecency/sdk";

import { isEngineToken, isSwapHiveAsset, MarketAsset } from "../../market-pair";

import { getEngineSymbolFromPair } from "./engine-market-rate-listener";

export const getEngineMarketRate = async (fromAsset: MarketAsset, toAsset: MarketAsset) => {
  const symbol = getEngineSymbolFromPair(fromAsset, toAsset);

  if (!symbol) {
    return 0;
  }

  const orderBook = await getHiveEngineOrderBook(symbol);

  if (isEngineToken(fromAsset) && isSwapHiveAsset(toAsset)) {
    const bestBid = orderBook.buy?.[0]?.price;
    return bestBid ? parseFloat(bestBid) : 0;
  }

  if (isSwapHiveAsset(fromAsset) && isEngineToken(toAsset)) {
    const bestAsk = orderBook.sell?.[0]?.price;
    if (!bestAsk) {
      return 0;
    }

    try {
      return new Decimal(1).div(bestAsk).toNumber();
    } catch (e) {
      return 0;
    }
  }

  return 0;
};
