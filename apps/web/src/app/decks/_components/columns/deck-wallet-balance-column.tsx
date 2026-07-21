import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GenericDeckColumn } from "./generic-deck-column";
import { calculateEngineTokensUsdValue } from "./helpers/engine-tokens-usd-value";
import { UserDeckGridItem } from "../types";
import "./_deck-wallet-balance-column.scss";
import { DeckGridContext } from "../deck-manager";
import { Spinner } from "@ui/spinner";
import { DEFAULT_DYNAMIC_PROPS } from "@/consts/default-dynamic-props";
import { withFeatureFlag } from "@/core/react-query";
import { EcencyConfigManager } from "@/config";
import {
  getAccountFullQueryOptions,
  getConversionRequestsQueryOptions,
  getDynamicPropsQueryOptions,
  getPointsQueryOptions
} from "@ecency/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrencyTokenRate } from "@ecency/sdk";
import { formattedNumber, HiveWallet, parseAsset, vestsToHp } from "@/utils";
import { getAllHiveEngineTokensQueryOptions } from "@ecency/sdk";
import { getHiveEngineTokensBalancesQueryOptions } from "@ecency/sdk";
import i18next from "i18next";
import { FormattedCurrency } from "@/features/shared";

interface Props {
  id: string;
  settings: UserDeckGridItem["settings"];
  draggable?: DraggableProvidedDragHandleProps | null;
}

export type Tab = "ecency" | "hive" | "engine";
const TABS: Tab[] = ["ecency", "hive", "engine"];

interface CardProps {
  title: string;
  description: string;
  value: any;
  isLoading: boolean;
}

const Card = ({ title, description, isLoading, value }: CardProps) => (
  <div className="wb-card">
    <div className="title">{title}</div>
    <div className="description">{description}</div>
    <div className={"value " + (isLoading ? "" : "loaded")}>
      {isLoading ? <Spinner className="size-4" /> : value}
    </div>
  </div>
);

export const DeckWalletBalanceColumn = ({
  id,
  draggable,
  settings: { username, updateIntervalMs }
}: Props) => {
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const queryClient = useQueryClient();
  const { updateColumnIntervalMs } = useContext(DeckGridContext);

  // Without the points feature there is nothing to show on the Ecency tab – it would
  // render an unavailable balance as a real zero – so the tab itself is dropped.
  const isPointsEnabled = EcencyConfigManager.getConfigValue(
    ({ visionFeatures }) => visionFeatures.points.enabled
  );
  const tabs = useMemo(
    () => (isPointsEnabled ? TABS : TABS.filter((t) => t !== "ecency")),
    [isPointsEnabled]
  );

  const [tab, setTab] = useState<Tab>(tabs[0]);

  // Ecency wallet
  const [pointsLoading, setPointsLoading] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState(0);
  const { data: points, isLoading: isPointsLoading } = useQuery(
    withFeatureFlag(
      ({ visionFeatures }) => visionFeatures.points.enabled,
      getPointsQueryOptions(username)
    )
  );

  // Hive wallet
  const [hive, setHive] = useState("0");
  const [hp, setHp] = useState("0");
  const [hbd, setHbd] = useState("0");
  const [savings, setSavings] = useState("0");
  const [hiveEstimatedValue, setHiveEstimatedValue] = useState(0);
  const [hiveLoading, setHiveLoading] = useState(false);

  // Hive engine wallet
  const [engineEstimatedValue, setEngineEstimatedValue] = useState("0");
  const [engineLoading, setEngineLoading] = useState(false);

  const fetchEcencyPoints = useCallback(
    async (refresh: boolean) => {
      setPointsLoading(true);

      try {
        // The balance itself comes from the points query, so a reload has to invalidate
        // it as well – refreshing only the rate left the balance on cached data.
        const [estimatedValue] = await Promise.all([
          getCurrencyTokenRate("usd", "estm"),
          refresh
            ? queryClient.invalidateQueries({
                queryKey: getPointsQueryOptions(username).queryKey
              })
            : Promise.resolve()
        ]);

        setEstimatedValue(Number(estimatedValue) || 0);
      } catch (e) {
      } finally {
        setPointsLoading(false);
      }
    },
    [queryClient, username]
  );

  const fetchHive = useCallback(
    async (refresh: boolean) => {
      setHiveLoading(true);

      try {
        if (refresh) {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getAccountFullQueryOptions(username).queryKey
            }),
            queryClient.invalidateQueries({
              queryKey: getConversionRequestsQueryOptions(username).queryKey
            })
          ]);
        }

        const [account, crd] = await Promise.all([
          queryClient.fetchQuery(getAccountFullQueryOptions(username)),
          queryClient.fetchQuery(getConversionRequestsQueryOptions(username))
        ]);

        let converting = 0;
        crd.forEach((x) => {
          converting += parseAsset(x.amount).amount;
        });

        if (account) {
          const wallet = new HiveWallet(account, dynamicProps ?? DEFAULT_DYNAMIC_PROPS, converting);
          setHive(formattedNumber(wallet.balance, { suffix: "HIVE" }));
          setHp(
            formattedNumber(
              vestsToHp(
                wallet.vestingShares,
                (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests
              ),
              {
                suffix: "HP"
              }
            )
          );
          setHbd(formattedNumber(wallet.hbdBalance, { prefix: "$" }));
          setSavings(formattedNumber(wallet.savingBalance, { suffix: "HIVE" }));
          setHiveEstimatedValue(wallet.estimatedValue);
        }
      } catch (e) {
      } finally {
        setHiveLoading(false);
      }
    },
    [dynamicProps, queryClient, username]
  );

  const fetchEngine = useCallback(
    async (refresh: boolean) => {
      setEngineLoading(true);

      try {
        if (refresh) {
          await queryClient.invalidateQueries({
            queryKey: ["assets", "hive-engine"]
          });
        }

        const userTokens = await queryClient.fetchQuery(
          getHiveEngineTokensBalancesQueryOptions(username)
        );

        // Prices are asked for by held symbol – an unfiltered metrics call is capped at
        // 1000 rows, so anything outside that page came back unpriced and was dropped
        // from the total.
        const tokens = await queryClient.fetchQuery(
          getAllHiveEngineTokensQueryOptions(
            undefined,
            userTokens.map((token) => token.symbol)
          )
        );

        const { base, quote } = dynamicProps ?? DEFAULT_DYNAMIC_PROPS;
        const pricePerHive = quote > 0 ? base / quote : 0;

        const totalWalletUsdValue = calculateEngineTokensUsdValue(userTokens, tokens, pricePerHive);

        const usdTotalValue = totalWalletUsdValue.toLocaleString("en-US", {
          style: "currency",
          currency: "USD"
        });
        setEngineEstimatedValue(usdTotalValue);
      } catch (e) {
      } finally {
        setEngineLoading(false);
      }
    },
    [dynamicProps, queryClient, username]
  );

  const fetch = useCallback(
    (refresh = false) => {
      if (tab === "ecency") {
        fetchEcencyPoints(refresh);
      }
      if (tab === "hive") {
        fetchHive(refresh);
      }

      if (tab === "engine") {
        fetchEngine(refresh);
      }
    },
    [fetchEcencyPoints, fetchEngine, fetchHive, tab]
  );

  useEffect(() => {
    fetch();
  }, [fetch, tab]);

  return (
    <GenericDeckColumn
      id={id}
      draggable={draggable}
      header={{
        title: `@${username}`,
        subtitle: i18next.t("decks.columns.balance"),
        icon: null,
        updateIntervalMs: updateIntervalMs,
        setUpdateIntervalMs: (v) => updateColumnIntervalMs(id, v)
      }}
      isReloading={pointsLoading || hiveLoading || engineLoading}
      onReload={() => fetch(true)}
    >
      <div className="wb-container">
        <div className="wb-tabs">
          {tabs.map((t) => (
            <div
              className={"wb-tab " + (tab === t ? "active" : "")}
              key={t}
              role="tab"
              tabIndex={0}
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setTab(t);
                }
              }}
            >
              {i18next.t(`decks.columns.balance-tab-${t}`)}
            </div>
          ))}
        </div>
        <div className="wb-content p-3">
          {tab === "ecency" && (
            <>
              <Card
                title={i18next.t("points.title")}
                description={i18next.t("points.main-description")}
                value={formattedNumber(points?.points ?? 0, {
                  suffix: i18next.t("points.points-unit")
                })}
                isLoading={isPointsLoading}
              />
              <Card
                title={i18next.t("wallet.estimated-points")}
                description={i18next.t("wallet.estimated-description-points")}
                value={
                  <FormattedCurrency
                    value={estimatedValue * (parseFloat(points?.points ?? "0") || 0)}
                    fixAt={3}
                  />
                }
                isLoading={pointsLoading || isPointsLoading}
              />
            </>
          )}
          {tab === "hive" && (
            <>
              <Card
                title={i18next.t("wallet.hive")}
                description={i18next.t("wallet.hive-description")}
                value={hive}
                isLoading={hiveLoading}
              />
              <Card
                title={i18next.t("wallet.hive-power")}
                description={i18next.t("wallet.hive-power-description")}
                value={hp}
                isLoading={hiveLoading}
              />
              <Card
                title={i18next.t("wallet.hive-dollars")}
                description={i18next.t("wallet.hive-dollars-description")}
                value={hbd}
                isLoading={hiveLoading}
              />
              <Card
                title={i18next.t("wallet.savings")}
                description={i18next.t("wallet.savings-description")}
                value={savings}
                isLoading={hiveLoading}
              />
              <Card
                title={i18next.t("wallet.estimated")}
                description={i18next.t("wallet.estimated-description")}
                value={<FormattedCurrency value={hiveEstimatedValue} fixAt={3} />}
                isLoading={hiveLoading}
              />
            </>
          )}
          {tab === "engine" && (
            <>
              <Card
                title={i18next.t("wallet-engine-estimated.title")}
                description={i18next.t("wallet-engine-estimated.description")}
                value={engineEstimatedValue}
                isLoading={engineLoading}
              />
            </>
          )}
        </div>
      </div>
    </GenericDeckColumn>
  );
};
