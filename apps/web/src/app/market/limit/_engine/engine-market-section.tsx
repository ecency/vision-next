"use client";

import React, { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import { useGlobalStore } from "@/core/global-store";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/button";
import {
  cancelEngineOrder,
  getEngineOpenOrders,
  getEngineOrderBook,
  getEngineTradeHistory,
  getTokenBalances,
  getTokens,
  placeEngineBuyOrder,
  placeEngineSellOrder
} from "@/api/hive-engine";
import { HiveEngineOpenOrder, HiveEngineTokenInfo, Token } from "@/entities";
import { success, error } from "@/features/shared";
import { WalletOperationsDialog } from "@/features/wallet";
import i18next from "i18next";
import { AssetOperation } from "@ecency/wallets";
import {
  EngineMarketSummary,
  EngineOrderBook,
  EngineOrderForm,
  EngineOpenOrders,
  EngineTradeHistory
} from "./";

interface Props {
  symbol: string;
  tokenInfo?: HiveEngineTokenInfo;
  tokensLoading: boolean;
  className?: string;
}

const QUOTE_SYMBOL = "SWAP.HIVE";

export function EngineMarketSection({ symbol, tokenInfo, tokensLoading, className }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const username = activeUser?.username;

  const [prefillBuyPrice, setPrefillBuyPrice] = useState<string | undefined>();
  const [prefillSellPrice, setPrefillSellPrice] = useState<string | undefined>();
  const [prefillBuyKey, setPrefillBuyKey] = useState(0);
  const [prefillSellKey, setPrefillSellKey] = useState(0);

  useEffect(() => {
    setPrefillBuyPrice(undefined);
    setPrefillSellPrice(undefined);
    setPrefillBuyKey((key) => key + 1);
    setPrefillSellKey((key) => key + 1);
  }, [symbol]);

  const tokenDefinitionQuery = useQuery({
    queryKey: ["hive-engine-token-definition", symbol],
    queryFn: async () => {
      const response = await getTokens([symbol]);
      return response[0];
    },
    enabled: !!symbol
  });

  const tokenDefinition = tokenDefinitionQuery.data as Token | undefined;
  const tokenPrecision = tokenDefinition?.precision ?? 8;

  const orderBookQuery = useQuery({
    queryKey: ["hive-engine-order-book", symbol],
    queryFn: () => getEngineOrderBook(symbol),
    enabled: !!symbol,
    refetchInterval: 10000
  });

  const tradeHistoryQuery = useQuery({
    queryKey: ["hive-engine-trades", symbol],
    queryFn: () => getEngineTradeHistory(symbol),
    enabled: !!symbol,
    refetchInterval: 15000
  });

  const balancesQuery = useQuery({
    queryKey: ["hive-engine-balances", username],
    queryFn: () => getTokenBalances(username!),
    enabled: !!username,
    refetchInterval: 60000
  });

  const openOrdersQuery = useQuery({
    queryKey: ["hive-engine-open-orders", username, symbol],
    queryFn: () => getEngineOpenOrders(username!, symbol),
    enabled: !!username && !!symbol,
    refetchInterval: 20000
  });

  const balances = balancesQuery.data ?? [];

  const quoteBalance = useMemo(() => {
    const balance = balances.find((item) => item.symbol === QUOTE_SYMBOL);
    return balance ? balance.balance : "0";
  }, [balances]);

  const tokenBalance = useMemo(() => {
    const balance = balances.find((item) => item.symbol === symbol);
    return balance ? balance.balance : "0";
  }, [balances, symbol]);

  const orderBook = orderBookQuery.data;
  const sortedOrderBook = useMemo(() => {
    const buyOrders = orderBook?.buy ? [...orderBook.buy] : [];
    const sellOrders = orderBook?.sell ? [...orderBook.sell] : [];

    const toDecimal = (value?: string) => {
      try {
        return new Decimal(value ?? 0);
      } catch (e) {
        return new Decimal(0);
      }
    };

    buyOrders.sort((a, b) => toDecimal(b.price).comparedTo(toDecimal(a.price)));
    sellOrders.sort((a, b) => toDecimal(a.price).comparedTo(toDecimal(b.price)));

    return { buy: buyOrders, sell: sellOrders };
  }, [orderBook]);
  const tradeHistory = useMemo(() => {
    const trades = tradeHistoryQuery.data ? [...tradeHistoryQuery.data] : [];
    return trades.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }, [tradeHistoryQuery.data]);
  const openOrders = openOrdersQuery.data ?? [];

  const bestAsk = sortedOrderBook.sell[0]?.price;
  const bestBid = sortedOrderBook.buy[0]?.price;

  const swapHiveDepositMemo =
    '{"id":"ssc-mainnet-hive","json":{"contractName":"hivepegged","contractAction":"buy","contractPayload":{}}}';
  const depositLabel = i18next.t("market.engine.deposit");
  const depositInstructions = username
    ? i18next.t("market.engine.deposit-instructions", { memo: swapHiveDepositMemo })
    : undefined;

  const depositAction = username ? (
    <WalletOperationsDialog
      className="shrink-0"
      operation={AssetOperation.Transfer}
      asset="HIVE"
      to="honey-swap"
      initialData={{ memo: swapHiveDepositMemo }}
      title={depositInstructions}
    >
      <Button
        appearance="link"
        size="xs"
        className="px-0 text-xs"
        title={depositInstructions}
      >
        {depositLabel}
      </Button>
    </WalletOperationsDialog>
  ) : (
    <Button
      appearance="link"
      size="xs"
      className="px-0 text-xs shrink-0"
      onClick={() => error(i18next.t("market.engine.login-required"))}
      title={i18next.t("market.engine.login-required")}
    >
      {depositLabel}
    </Button>
  );

  const requireAuth = () => {
    if (!username) {
      error(i18next.t("market.engine.login-required"));
      return false;
    }
    return true;
  };

  const refreshData = async () => {
    await Promise.all([
      orderBookQuery.refetch(),
      tradeHistoryQuery.refetch(),
      openOrdersQuery.refetch(),
      balancesQuery.refetch()
    ]);
  };

  const handleBuy = async ({ price, quantity }: { price: string; quantity: string }) => {
    if (!requireAuth()) {
      throw new Error(i18next.t("market.engine.login-required"));
    }

    await placeEngineBuyOrder(username!, symbol, quantity, price);
    success(i18next.t("market.engine.order-placed"));
    await refreshData();
  };

  const handleSell = async ({ price, quantity }: { price: string; quantity: string }) => {
    if (!requireAuth()) {
      throw new Error(i18next.t("market.engine.login-required"));
    }

    await placeEngineSellOrder(username!, symbol, quantity, price);
    success(i18next.t("market.engine.order-placed"));
    await refreshData();
  };

  const handleCancel = async (order: HiveEngineOpenOrder) => {
    if (!requireAuth()) {
      return;
    }

    try {
      await cancelEngineOrder(username!, order.type, order.id);
      success(i18next.t("market.engine.order-cancelled"));
      await refreshData();
    } catch (err: any) {
      if (err?.message) {
        error(err.message);
      } else {
        error(i18next.t("g.error"));
      }
    }
  };

  const handleSelectPrice = (price: string, type: "buy" | "sell") => {
    if (type === "buy") {
      setPrefillBuyPrice(price);
      setPrefillBuyKey((key) => key + 1);
    } else {
      setPrefillSellPrice(price);
      setPrefillSellKey((key) => key + 1);
    }
  };

  return (
    <div className={className}>
      <EngineMarketSummary token={tokenInfo} loading={tokensLoading} symbol={symbol} />

      <div className="mt-6 flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <EngineOrderForm
            type="buy"
            symbol={symbol}
            quoteSymbol={QUOTE_SYMBOL}
            available={quoteBalance}
            precision={tokenPrecision}
            bestPrice={bestAsk}
            prefillPrice={prefillBuyPrice}
            prefillKey={prefillBuyKey}
            disabled={!username || balancesQuery.isLoading}
            onSubmit={handleBuy}
            balanceAction={depositAction}
          />
          <EngineOrderForm
            type="sell"
            symbol={symbol}
            quoteSymbol={QUOTE_SYMBOL}
            available={tokenBalance}
            precision={tokenPrecision}
            bestPrice={bestBid}
            prefillPrice={prefillSellPrice}
            prefillKey={prefillSellKey}
            disabled={!username || balancesQuery.isLoading}
            onSubmit={handleSell}
          />
        </div>

        {username ? (
          <EngineOpenOrders
            orders={openOrders}
            loading={openOrdersQuery.isLoading}
            symbol={symbol}
            onCancel={handleCancel}
          />
        ) : (
          <div className="rounded border border-border-default p-4 text-center text-sm text-text-muted">
            {i18next.t("market.engine.login-to-trade")}
          </div>
        )}

        <EngineOrderBook
          buy={sortedOrderBook.buy}
          sell={sortedOrderBook.sell}
          loading={orderBookQuery.isLoading}
          symbol={symbol}
          onSelectPrice={handleSelectPrice}
        />

        <EngineTradeHistory
          trades={tradeHistory}
          loading={tradeHistoryQuery.isLoading}
          symbol={symbol}
        />
      </div>
    </div>
  );
}
