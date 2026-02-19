import Decimal from "decimal.js";

import type { EngineMarketOrderPayload, LimitOrderCreatePayload } from "@ecency/sdk";
import { OrderIdPrefix } from "@/enums";

import { HiveMarketAsset, MarketAsset, isEnginePair, isEngineToken, isHiveMarketAsset, isSwapHiveAsset } from "../market-pair";
import { getEngineSymbolFromPair } from "./engine";

export enum SwappingMethod {
  HIVE = "hive",
  CUSTOM = "custom"
}

const ENGINE_PRICE_PRECISION = 8;
const SWAP_ORDER_ID_PREFIX = OrderIdPrefix.SWAP;
const HIVE_AMOUNT_PRECISION = 3;
const ORDER_EXPIRY_DAYS = 27;

const parseAmount = (value: string) => {
  try {
    return new Decimal(value.replace(/,/gm, "") || "0");
  } catch (e) {
    return new Decimal(0);
  }
};

export const getMarketSwappingMethods = (fromAsset: MarketAsset, toAsset: MarketAsset) => {
  if (isHiveMarketAsset(fromAsset) && isHiveMarketAsset(toAsset)) {
    return [SwappingMethod.HIVE];
  }

  if (isEnginePair(fromAsset, toAsset)) {
    return [SwappingMethod.CUSTOM]; // Engine pairs use SDK mutation
  }

  return [];
};

export interface SwapOptions {
  fromAsset: MarketAsset;
  fromAmount: string;
  toAsset: MarketAsset;
  toAmount: string;
  engineTokenPrecision?: number;
}

/**
 * Build a LimitOrderCreatePayload for use with useLimitOrderCreateMutation.
 *
 * Handles the HIVE/HBD swap logic:
 * - Selling HIVE for HBD: amountToSell is HIVE, minToReceive is HBD
 * - Selling HBD for HIVE (buying HIVE): amountToSell is HBD, minToReceive is HIVE
 */
export function buildHiveSwapPayload(options: SwapOptions): LimitOrderCreatePayload | null {
  const fromAmount = +options.fromAmount.replace(/,/gm, "");
  const toAmount = +options.toAmount.replace(/,/gm, "");

  // Calculate expiration (27 days from now)
  const expiration = new Date(Date.now());
  expiration.setDate(expiration.getDate() + ORDER_EXPIRY_DAYS);
  const expirationStr = expiration.toISOString().split(".")[0];

  // Generate order ID with swap prefix
  const orderId = Number(
    `${SWAP_ORDER_ID_PREFIX}${Math.floor(Date.now() / 1000)
      .toString()
      .slice(2)}`
  );

  if (options.fromAsset === HiveMarketAsset.HIVE) {
    // Selling HIVE for HBD
    return {
      amountToSell: `${fromAmount.toFixed(HIVE_AMOUNT_PRECISION)} HIVE`,
      minToReceive: `${toAmount.toFixed(HIVE_AMOUNT_PRECISION)} HBD`,
      fillOrKill: false,
      expiration: expirationStr,
      orderId
    };
  } else if (options.fromAsset === HiveMarketAsset.HBD) {
    // Selling HBD for HIVE (buying HIVE)
    return {
      amountToSell: `${fromAmount.toFixed(HIVE_AMOUNT_PRECISION)} HBD`,
      minToReceive: `${toAmount.toFixed(HIVE_AMOUNT_PRECISION)} HIVE`,
      fillOrKill: false,
      expiration: expirationStr,
      orderId
    };
  }

  return null;
}

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
