"use client";

import React, { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import { useGlobalStore } from "@/core/global-store";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/button";
import {
  cancelEngineOrder,
  EngineOrderBroadcastOptions,
  EngineOrderSignMethod,
  getEngineOpenOrders,
  getEngineOrderBook,
  getEngineTradeHistory,
  getTokenBalances,
  getTokens,
  placeEngineBuyOrder,
  placeEngineSellOrder
} from "@/api/hive-engine";
import { HiveEngineOpenOrder, HiveEngineTokenInfo, Token } from "@/entities";
import { success, error, KeyOrHot } from "@/features/shared";
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
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { PrivateKey } from "@hiveio/dhive";
import { shouldUseHiveAuth } from "@/utils/client";

interface Props {
  symbol: string;
  tokenInfo?: HiveEngineTokenInfo;
  tokensLoading: boolean;
  className?: string;
}

const QUOTE_SYMBOL = "SWAP.HIVE";

type EngineOrderRequest =
  | {
      kind: "buy" | "sell";
      price: string;
      quantity: string;
      resolve: () => void;
      reject: (error: Error) => void;
    }
  | {
      kind: "cancel";
      order: HiveEngineOpenOrder;
      resolve: () => void;
      reject: (error: Error) => void;
    };

export function EngineMarketSection({ symbol, tokenInfo, tokensLoading, className }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const username = activeUser?.username;

  const [prefillBuyPrice, setPrefillBuyPrice] = useState<string | undefined>();
  const [prefillSellPrice, setPrefillSellPrice] = useState<string | undefined>();
  const [prefillBuyKey, setPrefillBuyKey] = useState(0);
  const [prefillSellKey, setPrefillSellKey] = useState(0);
  const [signRequest, setSignRequest] = useState<EngineOrderRequest | null>(null);
  const [isSigning, setIsSigning] = useState(false);

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

  const handleBuy = ({ price, quantity }: { price: string; quantity: string }) => {
    if (!requireAuth()) {
      throw new Error(i18next.t("market.engine.login-required"));
    }

    return new Promise<void>((resolve, reject) => {
      setSignRequest({ kind: "buy", price, quantity, resolve, reject });
    });
  };

  const handleSell = ({ price, quantity }: { price: string; quantity: string }) => {
    if (!requireAuth()) {
      throw new Error(i18next.t("market.engine.login-required"));
    }

    return new Promise<void>((resolve, reject) => {
      setSignRequest({ kind: "sell", price, quantity, resolve, reject });
    });
  };

  const handleCancel = async (order: HiveEngineOpenOrder) => {
    if (!requireAuth()) {
      return;
    }

    setSignRequest({
      kind: "cancel",
      order,
      resolve: () => undefined,
      reject: () => undefined
    });
  };

  const executeOrder = async (method: EngineOrderSignMethod, key?: PrivateKey) => {
    if (!signRequest || !username) {
      return;
    }

    const request = signRequest;
    const options: EngineOrderBroadcastOptions = { method };

    if (method === "key") {
      if (!key) {
        return;
      }

      options.key = key;
    }

    setIsSigning(true);

    try {
      if (request.kind === "buy") {
        await placeEngineBuyOrder(username, symbol, request.quantity, request.price, options);
        success(i18next.t("market.engine.order-placed"));
        await refreshData();
        request.resolve();
      } else if (request.kind === "sell") {
        await placeEngineSellOrder(username, symbol, request.quantity, request.price, options);
        success(i18next.t("market.engine.order-placed"));
        await refreshData();
        request.resolve();
      } else {
        await cancelEngineOrder(username, request.order.type, request.order.id, options);
        success(i18next.t("market.engine.order-cancelled"));
        await refreshData();
        request.resolve();
      }

      setSignRequest(null);
    } catch (err) {
      const normalizedError =
        err instanceof Error
          ? err
          : new Error((err as any)?.message ?? i18next.t("g.error"));

      if (request.kind === "buy" || request.kind === "sell") {
        request.reject(normalizedError);
      } else {
        if (normalizedError.message) {
          error(normalizedError.message);
        } else {
          error(i18next.t("g.error"));
        }
      }

      setSignRequest(null);
    } finally {
      setIsSigning(false);
    }
  };

  const signWithKey = (privateKey: PrivateKey) => executeOrder("key", privateKey);

  const signWithHot = () => executeOrder("hivesigner");

  const signWithKeychainOrHiveAuth = () =>
    executeOrder(shouldUseHiveAuth() ? "hiveauth" : "keychain");

  const handleSignerClose = () => {
    if (!signRequest) {
      return;
    }

    if (signRequest.kind === "buy" || signRequest.kind === "sell") {
      const cancellationError = new Error(i18next.t("g.cancelled"));
      (cancellationError as any).code = "USER_CANCELLED";
      signRequest.reject(cancellationError);
    }

    setSignRequest(null);
    setIsSigning(false);
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
    <>
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

      {signRequest && (
        <Modal
          show={true}
          centered={true}
          size="lg"
          onHide={isSigning ? undefined : handleSignerClose}
        >
          <ModalHeader closeButton={!isSigning} onHide={isSigning ? undefined : handleSignerClose} />
          <ModalBody>
            <KeyOrHot
              authority="active"
              inProgress={isSigning}
              onKey={signWithKey}
              onHot={signWithHot}
              onKc={signWithKeychainOrHiveAuth}
            />
          </ModalBody>
        </Modal>
      )}
    </>
  );
}
