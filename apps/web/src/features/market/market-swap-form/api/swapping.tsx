import Decimal from "decimal.js";

import { PrivateKey } from "@hiveio/dhive";

import type { EngineMarketOrderPayload } from "@ecency/sdk";
import { limitOrderCreate, limitOrderCreateHot, limitOrderCreateKc } from "@/api/operations";
import { ActiveUser } from "@/entities";
import { BuySellHiveTransactionType, OrderIdPrefix } from "@/enums";

import { HiveMarketAsset, MarketAsset, isEnginePair, isEngineToken, isHiveMarketAsset, isSwapHiveAsset } from "../market-pair";
import { getEngineSymbolFromPair } from "./engine";

export enum SwappingMethod {
  KEY = "key",
  HS = "hs",
  KC = "kc",
  CUSTOM = "custom"
}

const ENGINE_PRICE_PRECISION = 8;

const parseAmount = (value: string) => {
  try {
    return new Decimal(value.replace(/,/gm, "") || "0");
  } catch (e) {
    return new Decimal(0);
  }
};

export const getMarketSwappingMethods = (fromAsset: MarketAsset, toAsset: MarketAsset) => {
  if (isHiveMarketAsset(fromAsset) && isHiveMarketAsset(toAsset)) {
    return [SwappingMethod.HS, SwappingMethod.KC, SwappingMethod.KEY];
  }

  if (isEnginePair(fromAsset, toAsset)) {
    return [SwappingMethod.CUSTOM]; // Engine pairs use SDK mutation
  }

  return [];
};

export interface SwapOptions {
  activeUser: ActiveUser | null;
  fromAsset: MarketAsset;
  fromAmount: string;
  toAsset: MarketAsset;
  toAmount: string;
  engineTokenPrecision?: number;
}

export const swapByKey = (key: PrivateKey, options: SwapOptions) => {
  const fromAmount = +options.fromAmount.replace(/,/gm, "");
  const toAmount = +options.toAmount.replace(/,/gm, "");

  if (options.fromAsset === HiveMarketAsset.HIVE) {
    return limitOrderCreate(
      options.activeUser!.username,
      key,
      toAmount,
      fromAmount,
      BuySellHiveTransactionType.Sell,
      OrderIdPrefix.SWAP
    );
  } else if (options.fromAsset === HiveMarketAsset.HBD) {
    return limitOrderCreate(
      options.activeUser!.username,
      key,
      fromAmount,
      toAmount,
      BuySellHiveTransactionType.Buy,
      OrderIdPrefix.SWAP
    );
  }

  return Promise.reject();
};

export const swapByKc = (options: SwapOptions) => {
  const fromAmount = +options.fromAmount.replace(/,/gm, "");
  const toAmount = +options.toAmount.replace(/,/gm, "");

  if (options.fromAsset === HiveMarketAsset.HIVE) {
    return limitOrderCreateKc(
      options.activeUser!.username,
      toAmount,
      fromAmount,
      BuySellHiveTransactionType.Sell,
      OrderIdPrefix.SWAP
    );
  } else if (options.fromAsset === HiveMarketAsset.HBD) {
    return limitOrderCreateKc(
      options.activeUser!.username,
      fromAmount,
      toAmount,
      BuySellHiveTransactionType.Buy,
      OrderIdPrefix.SWAP
    );
  }

  return Promise.reject();
};

export const swapByHs = (options: SwapOptions) => {
  const fromAmount = +options.fromAmount.replace(/,/gm, "");
  const toAmount = +options.toAmount.replace(/,/gm, "");

  if (options.fromAsset === HiveMarketAsset.HIVE) {
    return limitOrderCreateHot(
      options.activeUser!.username,
      toAmount,
      fromAmount,
      BuySellHiveTransactionType.Sell,
      OrderIdPrefix.SWAP
    );
  } else if (options.fromAsset === HiveMarketAsset.HBD) {
    return limitOrderCreateHot(
      options.activeUser!.username,
      fromAmount,
      toAmount,
      BuySellHiveTransactionType.Buy,
      OrderIdPrefix.SWAP
    );
  }

  return Promise.resolve();
};

/**
 * Build engine swap payload for SDK mutation.
 * Used by sign-methods.tsx with useEngineMarketOrderMutation.
 */
export function buildEngineSwapPayload(
  options: SwapOptions
): EngineMarketOrderPayload | null {
  const symbol = getEngineSymbolFromPair(options.fromAsset, options.toAsset);
  if (!symbol) return null;

  const fromAmount = parseAmount(options.fromAmount);
  const toAmount = parseAmount(options.toAmount);
  if (fromAmount.lte(0) || toAmount.lte(0)) return null;

  const tokenPrecision = options.engineTokenPrecision ?? ENGINE_PRICE_PRECISION;

  if (isEngineToken(options.fromAsset) && isSwapHiveAsset(options.toAsset)) {
    return {
      action: "sell",
      symbol,
      quantity: fromAmount.toFixed(tokenPrecision, Decimal.ROUND_DOWN),
      price: toAmount.dividedBy(fromAmount).toFixed(ENGINE_PRICE_PRECISION, Decimal.ROUND_DOWN),
    };
  }

  if (isSwapHiveAsset(options.fromAsset) && isEngineToken(options.toAsset)) {
    return {
      action: "buy",
      symbol,
      quantity: toAmount.toFixed(tokenPrecision, Decimal.ROUND_DOWN),
      price: fromAmount.dividedBy(toAmount).toFixed(ENGINE_PRICE_PRECISION, Decimal.ROUND_DOWN),
    };
  }

  return null;
}
