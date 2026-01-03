import Decimal from "decimal.js";

import { PrivateKey } from "@hiveio/dhive";

import {
  EngineOrderBroadcastOptions,
  placeEngineBuyOrder,
  placeEngineSellOrder
} from "@/api/hive-engine";
import { limitOrderCreate, limitOrderCreateHot, limitOrderCreateKc } from "@/api/operations";
import { ActiveUser } from "@/entities";
import { BuySellHiveTransactionType, OrderIdPrefix } from "@/enums";
import { shouldUseHiveAuth } from "@/utils/client";

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
    return [SwappingMethod.KC, SwappingMethod.HS, SwappingMethod.KEY];
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

  if (isEnginePair(options.fromAsset, options.toAsset)) {
    return swapEngine("key", options, key);
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

  if (isEnginePair(options.fromAsset, options.toAsset)) {
    return swapEngine(
      shouldUseHiveAuth(options.activeUser?.username) ? "hiveauth" : "keychain",
      options
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

  if (isEnginePair(options.fromAsset, options.toAsset)) {
    return swapEngine("hivesigner", options);
  }
};

const swapEngine = (
  method: EngineOrderBroadcastOptions["method"],
  options: SwapOptions,
  key?: PrivateKey
) => {
  if (!options.activeUser) {
    return Promise.reject(new Error("User is not authenticated"));
  }

  const symbol = getEngineSymbolFromPair(options.fromAsset, options.toAsset);

  if (!symbol) {
    return Promise.reject(new Error("Invalid engine market pair"));
  }

  const fromAmount = parseAmount(options.fromAmount);
  const toAmount = parseAmount(options.toAmount);

  if (fromAmount.lte(0) || toAmount.lte(0)) {
    return Promise.reject(new Error("Invalid amount"));
  }

  const tokenPrecision = options.engineTokenPrecision ?? ENGINE_PRICE_PRECISION;
  const broadcastOptions: EngineOrderBroadcastOptions = { method };

  if (method === "key") {
    if (!key) {
      return Promise.reject(new Error("Active key is required"));
    }

    broadcastOptions.key = key;
  }

  if (isEngineToken(options.fromAsset) && isSwapHiveAsset(options.toAsset)) {
    const quantity = fromAmount.toFixed(tokenPrecision, Decimal.ROUND_DOWN);
    const price = toAmount.dividedBy(fromAmount).toFixed(ENGINE_PRICE_PRECISION, Decimal.ROUND_DOWN);

    return placeEngineSellOrder(options.activeUser.username, symbol, quantity, price, broadcastOptions);
  }

  if (isSwapHiveAsset(options.fromAsset) && isEngineToken(options.toAsset)) {
    const quantity = toAmount.toFixed(tokenPrecision, Decimal.ROUND_DOWN);
    const price = fromAmount.dividedBy(toAmount).toFixed(ENGINE_PRICE_PRECISION, Decimal.ROUND_DOWN);

    return placeEngineBuyOrder(options.activeUser.username, symbol, quantity, price, broadcastOptions);
  }

  return Promise.reject(new Error("Unsupported engine swap"));
};
