import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Decimal from "decimal.js";

import { getHiveEngineOrderBook } from "@ecency/sdk";
import { HiveEngineOrderBookEntry } from "@/entities";
import { error } from "@/features/shared";

import { isEnginePair, isEngineToken, isSwapHiveAsset, MarketAsset } from "../../market-pair";

type EngineOrderBook = {
  buy: HiveEngineOrderBookEntry[];
  sell: HiveEngineOrderBookEntry[];
};

interface ProcessingResult {
  tooMuchSlippage?: boolean;
  invalidAmount?: boolean;
  toAmount?: string;
  emptyOrderBook?: boolean;
}

const DEFAULT_PRECISION = 8;
const INITIAL_ORDERBOOK_LIMIT = 25;
const MAX_ORDERBOOK_LIMIT = 400;

const parseAmount = (amount: string) => {
  const normalized = amount.replace(/,/g, "");
  if (!normalized) {
    return new Decimal(0);
  }

  try {
    return new Decimal(normalized);
  } catch (err) {
    return new Decimal(0);
  }
};

const formatAmount = (value: Decimal, precision: number) => {
  try {
    return value.toFixed(precision, Decimal.ROUND_DOWN);
  } catch (e) {
    return value.toString();
  }
};

export const getEngineSymbolFromPair = (fromAsset: MarketAsset, toAsset: MarketAsset) => {
  if (isEngineToken(fromAsset)) {
    return fromAsset;
  }

  if (isEngineToken(toAsset)) {
    return toAsset;
  }

  return undefined;
};

const calculateSlippage = (firstPrice: Decimal, effectivePrice: Decimal) => {
  if (firstPrice.eq(0)) {
    return new Decimal(0);
  }

  return effectivePrice.minus(firstPrice).abs().dividedBy(firstPrice);
};

const processSellOrder = (amount: Decimal, orderBook: HiveEngineOrderBookEntry[]) => {
  if (!orderBook.length) {
    return { emptyOrderBook: true } as ProcessingResult;
  }

  const totalAvailable = orderBook.reduce((acc, order) => acc.plus(new Decimal(order.quantity || 0)), new Decimal(0));

  if (amount.gt(totalAvailable)) {
    return { invalidAmount: true } as ProcessingResult;
  }

  let remaining = amount;
  let accumulated = new Decimal(0);
  let effectivePrice = new Decimal(0);

  const firstPrice = new Decimal(orderBook[0].price || 0);

  for (const order of orderBook) {
    if (remaining.lte(0)) {
      break;
    }

    const quantity = new Decimal(order.quantity || 0);
    const price = new Decimal(order.price || 0);
    const tradable = Decimal.min(quantity, remaining);

    accumulated = accumulated.plus(tradable.mul(price));
    remaining = remaining.minus(tradable);
    effectivePrice = price;
  }

  const averagePrice = accumulated.dividedBy(amount);
  const slippage = calculateSlippage(firstPrice, averagePrice);

  return {
    toAmount: formatAmount(accumulated, DEFAULT_PRECISION),
    tooMuchSlippage: slippage.gt(0.05),
    invalidAmount: false
  } as ProcessingResult;
};

const processBuyOrder = (
  amount: Decimal,
  orderBook: HiveEngineOrderBookEntry[],
  tokenPrecision: number
) => {
  if (!orderBook.length) {
    return { emptyOrderBook: true } as ProcessingResult;
  }

  const totalCost = orderBook.reduce(
    (acc, order) => acc.plus(new Decimal(order.quantity || 0).mul(new Decimal(order.price || 0))),
    new Decimal(0)
  );

  if (amount.gt(totalCost)) {
    return { invalidAmount: true } as ProcessingResult;
  }

  let remaining = amount;
  let accumulated = new Decimal(0);
  let consumedTokens = new Decimal(0);

  const firstPrice = new Decimal(orderBook[0].price || 0);
  let effectivePrice = firstPrice;

  for (const order of orderBook) {
    if (remaining.lte(0)) {
      break;
    }

    const quantity = new Decimal(order.quantity || 0);
    const price = new Decimal(order.price || 0);
    const orderCost = quantity.mul(price);

    if (remaining.gte(orderCost)) {
      consumedTokens = consumedTokens.plus(quantity);
      accumulated = accumulated.plus(orderCost);
      remaining = remaining.minus(orderCost);
      effectivePrice = price;
    } else {
      const partialTokens = remaining.dividedBy(price);
      consumedTokens = consumedTokens.plus(partialTokens);
      accumulated = accumulated.plus(remaining);
      remaining = new Decimal(0);
      effectivePrice = price;
    }
  }

  if (consumedTokens.lte(0)) {
    return { invalidAmount: true } as ProcessingResult;
  }

  const averagePrice = accumulated.dividedBy(consumedTokens);
  const slippage = calculateSlippage(firstPrice, averagePrice);

  return {
    toAmount: formatAmount(consumedTokens, tokenPrecision),
    tooMuchSlippage: slippage.gt(0.05),
    invalidAmount: false
  } as ProcessingResult;
};

export const EngineMarket = {
  async fetchOrderBook(symbol: string, limit: number = 50): Promise<EngineOrderBook | null> {
    if (!symbol) {
      return null;
    }

    try {
      return await getHiveEngineOrderBook(symbol, limit);
    } catch (e) {
      error("Order book is empty.");
    }

    return null;
  },

  processOrderBook(
    buyOrderBook: HiveEngineOrderBookEntry[],
    sellOrderBook: HiveEngineOrderBookEntry[],
    amount: string,
    fromAsset: MarketAsset,
    toAsset: MarketAsset,
    tokenPrecision: number = DEFAULT_PRECISION
  ): ProcessingResult {
    if (!isEnginePair(fromAsset, toAsset)) {
      return {};
    }

    const quantity = parseAmount(amount);

    if (isEngineToken(fromAsset) && isSwapHiveAsset(toAsset)) {
      if (!buyOrderBook.length) {
        return { emptyOrderBook: true, toAmount: "0" };
      }

      if (quantity.lte(0)) {
        return { toAmount: "0" };
      }

      return processSellOrder(quantity, buyOrderBook);
    }

    if (isSwapHiveAsset(fromAsset) && isEngineToken(toAsset)) {
      if (!sellOrderBook.length) {
        return { emptyOrderBook: true, toAmount: "0" };
      }

      if (quantity.lte(0)) {
        return { toAmount: "0" };
      }

      return processBuyOrder(quantity, sellOrderBook, tokenPrecision);
    }

    return {};
  },

  async getNewAmount(
    toAmount: string,
    fromAmount: string,
    fromAsset: MarketAsset,
    toAsset: MarketAsset,
    tokenPrecision: number = DEFAULT_PRECISION
  ) {
    const symbol = getEngineSymbolFromPair(fromAsset, toAsset);

    if (!symbol) {
      return toAmount;
    }

    const orderBook = await EngineMarket.fetchOrderBook(symbol);

    if (!orderBook) {
      return toAmount;
    }

    const { toAmount: nextAmount } = EngineMarket.processOrderBook(
      orderBook.buy,
      orderBook.sell,
      fromAmount,
      fromAsset,
      toAsset,
      tokenPrecision
    );

    return nextAmount ?? toAmount;
  }
};

interface Props {
  fromAsset: MarketAsset;
  toAsset: MarketAsset;
  amount: string;
  setToAmount: (amount: string) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  setInvalidAmount: (value: boolean) => void;
  setTooMuchSlippage: (value: boolean) => void;
  setOrderBookState?: (value: "ok" | "empty" | "insufficient") => void;
  tokenPrecision?: number;
  coverageAmount?: string;
}

export const EngineMarketRateListener = ({
  fromAsset,
  toAsset,
  amount,
  setToAmount,
  setLoading,
  setInvalidAmount,
  setTooMuchSlippage,
  setOrderBookState,
  tokenPrecision = DEFAULT_PRECISION,
  coverageAmount
}: Props) => {
  const buyOrderBookRef = useRef<HiveEngineOrderBookEntry[]>([]);
  const sellOrderBookRef = useRef<HiveEngineOrderBookEntry[]>([]);
  const setLoadingRef = useRef(setLoading);
  const setOrderBookStateRef = useRef(setOrderBookState);

  const symbol = useMemo(() => getEngineSymbolFromPair(fromAsset, toAsset), [fromAsset, toAsset]);
  const coverageDecimal = useMemo(() => {
    if (!coverageAmount) {
      return null;
    }

    const parsed = parseAmount(coverageAmount);
    return parsed.gt(0) ? parsed : null;
  }, [coverageAmount]);

  const process = useCallback(
    (
      nextBuyOrderBook: HiveEngineOrderBookEntry[] = buyOrderBookRef.current,
      nextSellOrderBook: HiveEngineOrderBookEntry[] = sellOrderBookRef.current
    ) => {
      if (!symbol) {
        setOrderBookState?.("ok");
        return;
      }

      const { invalidAmount, tooMuchSlippage, toAmount: calculatedAmount, emptyOrderBook } =
        EngineMarket.processOrderBook(
          nextBuyOrderBook,
          nextSellOrderBook,
          amount,
          fromAsset,
          toAsset,
          tokenPrecision
        );

      if (emptyOrderBook) {
        setOrderBookState?.("empty");
      } else if (invalidAmount) {
        setOrderBookState?.("insufficient");
      } else {
        setOrderBookState?.("ok");
      }

      setInvalidAmount(!!invalidAmount && !emptyOrderBook);
      setTooMuchSlippage(!!tooMuchSlippage && !emptyOrderBook);

      if (calculatedAmount !== undefined) {
        setToAmount(calculatedAmount);
      }
    },
    [
      amount,
      fromAsset,
      setInvalidAmount,
      setOrderBookState,
      setTooMuchSlippage,
      setToAmount,
      symbol,
      tokenPrecision,
      toAsset
    ]
  );

  const processRef = useRef(process);

  useEffect(() => {
    processRef.current = process;
  }, [process]);

  useEffect(() => {
    setLoadingRef.current = setLoading;
  }, [setLoading]);

  useEffect(() => {
    setOrderBookStateRef.current = setOrderBookState;
  }, [setOrderBookState]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    const fetch = async () => {
      if (!symbol) {
        setOrderBookStateRef.current?.("ok");
        return;
      }

      setLoadingRef.current(true);
      try {
        let limit = INITIAL_ORDERBOOK_LIMIT;
        let book: EngineOrderBook | null = null;
        let nextBuy: HiveEngineOrderBookEntry[] = [];
        let nextSell: HiveEngineOrderBookEntry[] = [];

        const isSellingEngineToken = isEngineToken(fromAsset) && isSwapHiveAsset(toAsset);
        const isBuyingEngineToken = isSwapHiveAsset(fromAsset) && isEngineToken(toAsset);

        while (true) {
          book = await EngineMarket.fetchOrderBook(symbol, limit);

          if (!book) {
            nextBuy = [];
            nextSell = [];
            break;
          }

          nextBuy = book.buy ?? [];
          nextSell = book.sell ?? [];

          const shouldLimitByCoverage =
            !!coverageDecimal && (isSellingEngineToken || isBuyingEngineToken);

          if (!shouldLimitByCoverage) {
            break;
          }

          let coverageSatisfied = false;

          if (isSellingEngineToken) {
            const totalQuantity = nextBuy.reduce(
              (acc, order) => acc.plus(new Decimal(order.quantity || 0)),
              new Decimal(0)
            );
            coverageSatisfied = totalQuantity.gte(coverageDecimal);

            if (coverageSatisfied || nextBuy.length < limit) {
              break;
            }
          } else if (isBuyingEngineToken) {
            const totalCost = nextSell.reduce(
              (acc, order) =>
                acc.plus(new Decimal(order.quantity || 0).mul(new Decimal(order.price || 0))),
              new Decimal(0)
            );
            coverageSatisfied = totalCost.gte(coverageDecimal);

            if (coverageSatisfied || nextSell.length < limit) {
              break;
            }
          }

          if (limit >= MAX_ORDERBOOK_LIMIT) {
            break;
          }

          limit = Math.min(limit * 2, MAX_ORDERBOOK_LIMIT);
        }

        buyOrderBookRef.current = nextBuy;
        sellOrderBookRef.current = nextSell;
        processRef.current(nextBuy, nextSell);
      } finally {
        setLoadingRef.current(false);
      }
    };

    fetch();
    interval = setInterval(fetch, 10000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    coverageDecimal,
    fromAsset,
    symbol,
    toAsset
  ]);

  useEffect(() => {
    process();
  }, [amount, fromAsset, process, toAsset]);

  return <></>;
};
