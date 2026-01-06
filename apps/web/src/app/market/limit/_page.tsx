"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiveEngineTokenInfo,
  MarketStatistics,
  OpenOrdersData,
  OrdersData
} from "@/entities";
import { getMarketStatistics, getOpenOrder, getOrderBook, getTradeHistory } from "@/api/hive";
import { ButtonGroup } from "@/features/ui";
import { Feedback, Navbar, Skeleton } from "@/features/shared";
import i18next from "i18next";
import { HiveBarter } from "@/app/market/_components/hive-barter";
import { ChartStats } from "@/app/market/limit/_components/chart-stats";
import MarketChart from "@/app/market/limit/_components/market-chart";
import { OpenOrders } from "@/app/market/_components/open-orders";
import { Orders } from "@/app/market/limit/_components/orders";
import { MarketMode } from "@/app/market/_enums/market-mode";
import { Tsx } from "@/features/i18n/helper";
import { ModeSelector } from "@/app/market/_components/mode-selector";
import { useRouter } from "next/navigation";
import { getAllHiveEngineTokensQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { MarketTokenSelector, MarketSelection } from "@/app/market/limit/_components/token-selector";
import { EngineMarketSection } from "@/app/market/limit/_engine";
import "../index.scss";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function MarketLimitPage() {
  const router = useRouter();
  const [selection, setSelection] = useState<MarketSelection>({ type: "core" });

  const tokensQuery = useQuery(getAllHiveEngineTokensQueryOptions());
  const tokens = tokensQuery.data ?? [];

  useEffect(() => {
    if (selection.type !== "engine" || tokens.length === 0) {
      return;
    }

    const exists = tokens.some((token) => token.symbol === selection.symbol);
    if (!exists) {
      setSelection({ type: "engine", symbol: tokens[0].symbol });
    }
  }, [tokens, selection]);

  const tokenInfo = useMemo<HiveEngineTokenInfo | undefined>(() => {
    if (selection.type !== "engine") {
      return undefined;
    }

    return tokens.find((token) => token.symbol === selection.symbol);
  }, [selection, tokens]);

  return (
    <>
      <Feedback />
      <div className={"flex justify-center market-page mb-24 " + MarketMode.LIMIT}>
        <div className="sm:w-[75%] p-3 sm:p-0">
          <div style={{ marginBottom: "6rem" }}>
            <Navbar />
          </div>
          <div className="mb-5 flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-bold">{i18next.t("market.title")}</h2>
            <Tsx k="market.description">
              <div className="header-description" />
            </Tsx>
          </div>
          <ModeSelector
            className="mb-5 mx-auto equal-widths max-w-[600px]"
            mode={MarketMode.LIMIT}
            onSelect={(mode) => {
              switch (mode) {
                case MarketMode.ADVANCED:
                  router.push("/market/advanced");
                  break;
                case MarketMode.SWAP:
                  router.push("/market/swap");
                  break;
                default:
                  break;
              }
            }}
          />

          <MarketTokenSelector
            selection={selection}
            onSelect={setSelection}
            tokens={tokens}
            loading={tokensQuery.isLoading}
          />

          {selection.type === "core" ? (
            <HiveLimitContent />
          ) : (
            <EngineLimitContent
              symbol={selection.symbol}
              tokenInfo={tokenInfo}
              tokensLoading={tokensQuery.isLoading}
            />
          )}
        </div>
      </div>
    </>
  );
}

const EngineLimitContent = ({
  symbol,
  tokenInfo,
  tokensLoading
}: {
  symbol: string;
  tokenInfo?: HiveEngineTokenInfo;
  tokensLoading: boolean;
}) => {
  return (
    <div className="flex justify-content-md-between flex-col">
      <div className="mb-5">
        <div className="text-2xl mb-3">{i18next.t("market.stock-info")}</div>
        <EngineMarketSection symbol={symbol} tokenInfo={tokenInfo} tokensLoading={tokensLoading} />
      </div>
    </div>
  );
};

const HiveLimitContent = () => {
  const { username: activeUsername, account: activeAccount } = useActiveAccount();

  const [data, setData] = useState<MarketStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [bidValues, setBidValues] = useState<any>({ lowest: 0, highest: 0, total: 0, amount: 0 });
  const [openOrdersdata, setopenOrdersdata] = useState<OpenOrdersData[]>([]);
  const [openOrdersDataLoading, setopenOrdersDataLoading] = useState(false);
  const [tablesData, setTablesData] = useState<OrdersData | null>(null);
  const [loadingTablesData, setLoadingTablesData] = useState(false);
  const [dataLoadedFirstTime, setDataLoadedFirstTime] = useState(false);
  const [exchangeType, setExchangeType] = useState(1);

  useEffect(() => {
    if (!activeUsername) {
      setopenOrdersdata([]);
      setopenOrdersDataLoading(false);
    }
  }, [activeUsername]);

  const updateData = useCallback(
    (withLoading = false) => {
      if (withLoading) {
        setLoading(true);
        setLoadingTablesData(true);
        setopenOrdersDataLoading(true);
      }

      getMarketStatistics().then((res) => {
        setLoading(false);
        setData(res);
      });
      getOrderBook().then((res) => {
        getTradeHistory().then((trading) => {
          setLoadingTablesData(false);
          setTablesData({ ...res, trading });
        });
      });
      if (activeUsername) {
        getOpenOrder(activeUsername).then((res) => {
          setopenOrdersdata(res);
          setopenOrdersDataLoading(false);
        });
      } else if (withLoading) {
        setopenOrdersdata([]);
        setopenOrdersDataLoading(false);
      }
    },
    [activeUsername]
  );

  const updateOpenData = useCallback(() => {
    if (!activeUsername) {
      setopenOrdersdata([]);
      setopenOrdersDataLoading(false);
      return;
    }

    setopenOrdersDataLoading(true);
    getOpenOrder(activeUsername).then((res) => {
      setopenOrdersdata(res);
      setopenOrdersDataLoading(false);
    });
  }, [activeUsername]);

  useEffect(() => {
    updateData(true);
    const interval = setInterval(() => updateData(), 20000);
    return () => clearInterval(interval);
  }, [updateData]);

  useEffect(() => {
    if (!dataLoadedFirstTime && data) {
      setBidValues({
        lowest: parseFloat(data.lowest_ask),
        highest: parseFloat(data.highest_bid)
      });
      setDataLoadedFirstTime(true);
    }
  }, [data, dataLoadedFirstTime]);

  return (
    <>
      <div className="flex justify-content-md-between flex-col">
        <div className="mb-5">
          <div className="text-2xl mb-3">
            {loading ? <Skeleton className="skeleton-loading" /> : i18next.t("market.stock-info")}
          </div>
          <ChartStats data={data} loading={loading} />
        </div>

        {data && tablesData ? (
          <MarketChart bids={tablesData.bids || []} asks={tablesData.asks || []} />
        ) : (
          i18next.t("g.loading") + "..."
        )}
      </div>
      <div className="flex justify-center">
        <div className="container my-5 mx-0">
          <div>
            {activeUsername && (
              <div className="grid-cols-12 justify-between hidden px-3 md:grid">
                <div className="col-span-12 p-0 sm:col-span-5">
                  <HiveBarter
                    type={1}
                    available={activeAccount?.hbd_balance || "0"}
                    prefilledTotal={bidValues.total}
                    prefilledAmount={bidValues.amount}
                    peakValue={parseFloat(bidValues.lowest)}
                    basePeakValue={data ? parseFloat(data.lowest_ask) : 0}
                    loading={loading}
                    username={activeUsername}
                    onTransactionSuccess={updateOpenData}
                    onClickPeakValue={(value: any) => setBidValues({ ...bidValues, lowest: value })}
                  />
                </div>
                <div className="col-span-12 p-0 sm:col-start-8 sm:col-span-5">
                  <HiveBarter
                    type={2}
                    prefilledTotal={bidValues.total}
                    prefilledAmount={bidValues.amount}
                    available={activeAccount?.balance || "0"}
                    peakValue={parseFloat(bidValues.highest)}
                    basePeakValue={data ? parseFloat(data.highest_bid) : 0}
                    loading={loading}
                    username={activeUsername}
                    onTransactionSuccess={updateOpenData}
                    onClickPeakValue={(value: any) => setBidValues({ ...bidValues, highest: value })}
                  />
                </div>
              </div>
            )}

            {activeUsername && (
              <div className="flex flex-col md:hidden">
                <div className="flex flex-col justify-start sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-2xl">{i18next.t("market.barter")}</div>
                  <ButtonGroup
                    className="my-3"
                    labels={[i18next.t("market.buy"), i18next.t("market.sell")]}
                    selected={exchangeType === 1 ? 0 : 1}
                    setSelected={(v) => setExchangeType(v + 1)}
                  />
                </div>

                {exchangeType === 1 ? (
                  <HiveBarter
                    type={1}
                    available={activeAccount?.hbd_balance || "0"}
                    peakValue={parseFloat(bidValues.lowest)}
                    basePeakValue={data ? parseFloat(data.lowest_ask) : 0}
                    loading={loading}
                    username={activeUsername}
                    onTransactionSuccess={updateOpenData}
                    onClickPeakValue={() =>
                      setBidValues({
                        ...bidValues,
                        lowest: data ? parseFloat(data.lowest_ask) : 0
                      })
                    }
                  />
                ) : (
                  <HiveBarter
                    type={2}
                    available={activeAccount?.balance || "0"}
                    peakValue={parseFloat(bidValues.highest)}
                    basePeakValue={data ? parseFloat(data.highest_bid) : 0}
                    loading={loading}
                    onTransactionSuccess={updateOpenData}
                    username={activeUsername}
                    onClickPeakValue={() =>
                      setBidValues({
                        ...bidValues,
                        highest: data ? parseFloat(data.highest_bid) : 0
                      })
                    }
                  />
                )}
              </div>
            )}

            <div className="mx-0 mt-5 grid grid-cols-12 justify-between">
              {!openOrdersDataLoading && openOrdersdata.length > 0 && activeUsername && (
                <div className="col-span-12 mb-5 px-0">
                  <OpenOrders
                    onTransactionSuccess={updateOpenData}
                    data={openOrdersdata}
                    loading={openOrdersDataLoading}
                    username={activeUsername}
                  />
                </div>
              )}
              <div className="col-span-12 px-0 xl:col-span-5">
                <Orders
                  onPriceClick={(value) =>
                    setBidValues({
                      highest: value.key1,
                      lowest: value.key1,
                      total: value.key3,
                      amount: value.key2
                    })
                  }
                  type={1}
                  loading={loadingTablesData}
                  data={tablesData ? tablesData.bids : []}
                />
              </div>
              <div className="col-span-12 mt-5 px-0 sm:px-[auto] xl:col-start-8 xl:col-span-5 lg:mt-0">
                <Orders
                  onPriceClick={(value) =>
                    setBidValues({
                      lowest: value.key1,
                      highest: value.key1,
                      total: value.key3,
                      amount: value.key2
                    })
                  }
                  type={2}
                  loading={loadingTablesData}
                  data={tablesData ? tablesData.asks : []}
                />
              </div>
              <div className="col-span-12 mt-5 px-0 sm:px-[auto]">
                <Orders type={3} loading={loadingTablesData} data={tablesData ? tablesData.trading : []} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
