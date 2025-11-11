import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Alert } from "@ui/alert";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import { classNameObject } from "@ui/util";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import i18next from "i18next";
import useMount from "react-use/lib/useMount";

import { getTokenBalances, getTokens } from "@/api/hive-engine";
import { fetchAllHiveEngineTokens } from "@/api/queries/engine";
import { useGlobalStore } from "@/core/global-store";
import { QueryIdentifiers } from "@/core/react-query";
import { HiveEngineTokenInfo, Token, TokenBalance } from "@/entities";
import { checkSvg, swapSvg } from "@ui/svg";

import { getBalance } from "./api/get-balance";
import { useCurrencyRateQuery } from "./api/currency-rate-query";
import { EngineMarketRateListener, getEngineMarketRate, getEngineSymbolFromPair } from "./api/engine";
import { getHiveMarketRate, HiveMarketRateListener } from "./api/hive";
import { MarketInfo } from "./market-info";
import {
  CORE_MARKET_ASSETS,
  HiveMarketAsset,
  MarketAsset,
  MarketPairs,
  SWAP_HIVE,
  isEnginePair,
  isEngineToken,
  isHiveMarketAsset,
  isSwapHiveAsset
} from "./market-pair";
import { MarketSwapFormHeader } from "./market-swap-form-header";
import { MarketSwapFormSuccess } from "./market-swap-form-success";
import { MarketSwapFormStep } from "./form-step";
import { SignMethods } from "./sign-methods";
import { SwapAmountControl } from "./swap-amount-control";
import "./index.scss";

export * from "./swap-mode";

export interface Props {
  padding?: string;
}

const DEFAULT_ENGINE_PRECISION = 8;

const formatEngineBalance = (balance?: string, symbol?: string) => {
  if (!symbol) {
    return "";
  }

  if (!balance) {
    return `0 ${symbol}`;
  }

  return `${balance} ${symbol}`;
};

export const MarketSwapForm = ({ padding = "p-4" }: Props) => {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const currency = useGlobalStore((s) => s.currency);

  const [step, setStep] = useState(MarketSwapFormStep.FORM);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isInvalidFrom, setIsInvalidFrom] = useState(false);

  const [fromAsset, setFromAsset] = useState<MarketAsset>(HiveMarketAsset.HIVE);
  const [toAsset, setToAsset] = useState<MarketAsset>(HiveMarketAsset.HBD);

  const [balance, setBalance] = useState("");

  const [marketRate, setMarketRate] = useState(0);

  const [accountFromMarketRate, setAccountFromMarketRate] = useState(0);
  const [accountToMarketRate, setAccountToMarketRate] = useState(0);

  const [disabled, setDisabled] = useState(false);
  const [isAmountMoreThanBalance, setIsAmountMoreThanBalance] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tooMuchSlippage, setTooMuchSlippage] = useState(false);
  const [engineOrderBookState, setEngineOrderBookState] = useState<"ok" | "empty" | "insufficient">("ok");

  const queryClient = useQueryClient();

  const { data: engineTokens = [] } = useQuery<HiveEngineTokenInfo[]>({
    queryKey: [QueryIdentifiers.HIVE_ENGINE_ALL_TOKENS, undefined],
    queryFn: () => fetchAllHiveEngineTokens(),
    staleTime: 60000
  });

  const engineBalancesQuery = useQuery({
    queryKey: [QueryIdentifiers.HIVE_ENGINE_TOKEN_BALANCES, activeUser?.username],
    queryFn: () => getTokenBalances(activeUser!.username),
    enabled: !!activeUser,
    refetchInterval: 60000
  });

  const engineBalances = useMemo(
    () => (engineBalancesQuery.data ?? []) as TokenBalance[],
    [engineBalancesQuery.data]
  );

  const engineBalancesMap = useMemo(() => {
    const map = new Map<string, string>();

    engineBalances.forEach((item) => {
      map.set(item.symbol, item.balance);
    });

    return map;
  }, [engineBalances]);

  const engineTokenSymbols = useMemo(() => {
    const symbols = new Set<string>();

    engineTokens.forEach((token) => {
      const symbol = token.symbol;
      if (symbol && symbol !== SWAP_HIVE && !isHiveMarketAsset(symbol)) {
        symbols.add(symbol);
      }
    });

    engineBalances.forEach((item) => {
      const symbol = item.symbol;
      if (symbol && symbol !== SWAP_HIVE && !isHiveMarketAsset(symbol)) {
        symbols.add(symbol);
      }
    });

    return Array.from(symbols).sort((a, b) => a.localeCompare(b));
  }, [engineTokens, engineBalances]);

  const engineTokenSymbolsWithBalance = useMemo(() => {
    const symbols = new Set<string>();

    engineBalances.forEach((item) => {
      const symbol = item.symbol;
      const balance = parseFloat(item.balance ?? "0");

      if (symbol && balance > 0 && symbol !== SWAP_HIVE && !isHiveMarketAsset(symbol)) {
        symbols.add(symbol);
      }
    });

    return Array.from(symbols).sort((a, b) => a.localeCompare(b));
  }, [engineBalances]);

  const availableFromAssets = useMemo<MarketAsset[]>(() => {
    const base = [...CORE_MARKET_ASSETS, SWAP_HIVE];
    const assets = new Set<MarketAsset>([...base, ...(engineTokenSymbolsWithBalance as MarketAsset[])]);

    if (isEngineToken(fromAsset) && !assets.has(fromAsset)) {
      assets.add(fromAsset);
    }

    return Array.from(assets);
  }, [engineTokenSymbolsWithBalance, fromAsset]);

  const availableToAssets = useMemo<MarketAsset[]>(() => {
    if (isHiveMarketAsset(fromAsset)) {
      const base = MarketPairs[fromAsset as HiveMarketAsset];
      return base.filter((asset) => asset !== fromAsset);
    }

    if (isSwapHiveAsset(fromAsset)) {
      return engineTokenSymbols;
    }

    if (isEngineToken(fromAsset)) {
      return [SWAP_HIVE];
    }

    return [];
  }, [fromAsset, engineTokenSymbols]);

  const engineSymbol = useMemo(() => getEngineSymbolFromPair(fromAsset, toAsset), [fromAsset, toAsset]);

  const engineCoverageAmount = useMemo(() => {
    if (!activeUser) {
      return undefined;
    }

    if (!isEnginePair(fromAsset, toAsset)) {
      return undefined;
    }

    if (isEngineToken(fromAsset)) {
      return engineBalancesMap.get(fromAsset) ?? undefined;
    }

    if (isSwapHiveAsset(fromAsset)) {
      return engineBalancesMap.get(SWAP_HIVE) ?? undefined;
    }

    return undefined;
  }, [activeUser, engineBalancesMap, fromAsset, toAsset]);

  const engineTokenDefinitionQuery = useQuery({
    queryKey: ["market-swap-engine-token", engineSymbol],
    queryFn: async () => {
      if (!engineSymbol) {
        return undefined;
      }

      const tokens = await getTokens([engineSymbol]);
      return tokens[0];
    },
    enabled: !!engineSymbol
  });

  const engineTokenPrecision = (engineTokenDefinitionQuery.data as Token | undefined)?.precision ?? DEFAULT_ENGINE_PRECISION;

  const { data } = useCurrencyRateQuery(fromAsset, toAsset);

  useMount(() => {
    fetchMarket();
  });

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: [QueryIdentifiers.SWAP_FORM_CURRENCY_RATE, currency, fromAsset, toAsset]
    });
  }, [fromAsset, toAsset, currency, queryClient]);

  useEffect(() => {
    if (data) {
      setAccountFromMarketRate(data[0]);
      setAccountToMarketRate(data[1]);
    } else {
      setAccountFromMarketRate(0);
      setAccountToMarketRate(0);
    }
  }, [data]);

  useEffect(() => {
    if (!activeUser) {
      setBalance("");
      return;
    }

    if (isHiveMarketAsset(fromAsset)) {
      setBalance(getBalance(fromAsset as HiveMarketAsset, activeUser));
      return;
    }

    const symbol = isSwapHiveAsset(fromAsset) ? SWAP_HIVE : fromAsset;
    setBalance(formatEngineBalance(engineBalancesMap.get(symbol), symbol));
  }, [activeUser, fromAsset, engineBalancesMap]);

  useEffect(() => {
    if (isHiveMarketAsset(fromAsset)) {
      setToAsset(fromAsset === HiveMarketAsset.HIVE ? HiveMarketAsset.HBD : HiveMarketAsset.HIVE);
    } else if (isSwapHiveAsset(fromAsset)) {
      if (!isEngineToken(toAsset) || !engineTokenSymbols.includes(toAsset)) {
        if (engineTokenSymbols.length > 0) {
          setToAsset(engineTokenSymbols[0]);
        }
      }
    } else if (isEngineToken(fromAsset)) {
      setToAsset(SWAP_HIVE);
    }
  }, [fromAsset, engineTokenSymbols, toAsset]);

  useEffect(() => {
    if (!isEnginePair(fromAsset, toAsset)) {
      setEngineOrderBookState("ok");
    }
  }, [fromAsset, toAsset]);

  const fetchMarket = useCallback(async () => {
    setDisabled(true);
    try {
      if (isHiveMarketAsset(fromAsset) && isHiveMarketAsset(toAsset)) {
        setMarketRate(await getHiveMarketRate(fromAsset as HiveMarketAsset));
      } else if (isEnginePair(fromAsset, toAsset)) {
        const rate = await getEngineMarketRate(fromAsset, toAsset);
        setMarketRate(rate);
      } else {
        setMarketRate(0);
      }
    } finally {
      setDisabled(false);
    }
  }, [fromAsset, toAsset]);

  useEffect(() => {
    fetchMarket();
  }, [fromAsset, toAsset, fetchMarket]);

  useEffect(() => {
    fetchMarket();
  }, [currency, fetchMarket]);

  const swap = () => {
    setToAsset(fromAsset);
    setFromAsset(toAsset);
    setTo(from);
    setFrom(to);
    setMarketRate(marketRate !== 0 ? 1 / marketRate : 0);
  };

  const submit = () => {
    if (step === MarketSwapFormStep.FORM) {
      setStep(MarketSwapFormStep.SIGN);
    }
  };

  const stepBack = () => {
    if (step === MarketSwapFormStep.SIGN) {
      setStep(MarketSwapFormStep.FORM);
    }
  };

  const numberAmount = (v: string) => +v.replace(/,/gm, "");

  const validateBalance = useCallback(() => {
    if (!balance) {
      return;
    }

    const [availableBalance] = balance.split(" ");
    const amount = numberAmount(from);
    const availableBalanceAmount = +availableBalance;

    if (!isNaN(availableBalanceAmount)) {
      setIsAmountMoreThanBalance(amount > availableBalanceAmount);
    }
  }, [balance, from]);

  const reset = () => {
    setFrom("0");
    setTo("0");
    fetchMarket();
    setStep(MarketSwapFormStep.FORM);
  };

  useEffect(() => {
    validateBalance();
  }, [from, balance, validateBalance]);

  const isHiveSwap = isHiveMarketAsset(fromAsset) && isHiveMarketAsset(toAsset);
  const isEngineSwap = isEnginePair(fromAsset, toAsset);

  return (
    <div
      className={classNameObject({
        "market-swap-form relative": true,
        [padding]: true
      })}
    >
      {isHiveSwap ? (
        <HiveMarketRateListener
          amount={from}
          asset={fromAsset as HiveMarketAsset}
          setToAmount={(v) => setTo(v)}
          loading={disabled}
          setLoading={(v) => setDisabled(v)}
          setInvalidAmount={(v) => setIsInvalidFrom(v)}
          setTooMuchSlippage={(v) => setTooMuchSlippage(v)}
        />
      ) : null}
      {isEngineSwap ? (
        <EngineMarketRateListener
          amount={from}
          fromAsset={fromAsset}
          toAsset={toAsset}
          setToAmount={(v) => setTo(v)}
          loading={disabled}
          setLoading={(v) => setDisabled(v)}
          setInvalidAmount={(v) => setIsInvalidFrom(v)}
          setTooMuchSlippage={(v) => setTooMuchSlippage(v)}
          setOrderBookState={(state) => setEngineOrderBookState(state)}
          tokenPrecision={engineTokenPrecision}
          coverageAmount={engineCoverageAmount}
        />
      ) : null}
      <MarketSwapFormHeader
        className={step === MarketSwapFormStep.SUCCESS ? "blurred" : ""}
        step={step}
        loading={loading || disabled}
        onBack={stepBack}
      />
      <Form className={step === MarketSwapFormStep.SUCCESS ? "blurred" : ""} onSubmit={() => submit()}>
        <SwapAmountControl
          className={step === MarketSwapFormStep.SIGN ? "mb-3" : ""}
          asset={fromAsset}
          balance={balance}
          availableAssets={availableFromAssets}
          labelKey="market.from"
          value={from}
          setValue={(v) => setFrom(v)}
          setAsset={(v) => setFromAsset(v)}
          usdRate={accountFromMarketRate}
          disabled={
            step === MarketSwapFormStep.SIGN ||
            step === MarketSwapFormStep.SUCCESS ||
            disabled ||
            loading
          }
          showBalance={[MarketSwapFormStep.FORM, MarketSwapFormStep.SIGN].includes(step)}
          elementAfterBalance={
            isAmountMoreThanBalance && step === MarketSwapFormStep.FORM ? (
              <small className="usd-balance bold text-gray-600 block text-red mt-3">
                {i18next.t("market.more-than-balance")}
              </small>
            ) : (
              <></>
            )
          }
        />
        {[MarketSwapFormStep.FORM, MarketSwapFormStep.SUCCESS].includes(step) ? (
          <div className="swap-button-container">
            <div className="overlay">
              {step === MarketSwapFormStep.FORM ? (
                <Button
                  outline={true}
                  disabled={disabled || loading}
                  className="swap-button !border"
                  onClick={swap}
                  icon={swapSvg}
                />
              ) : (
                <></>
              )}
              {step === MarketSwapFormStep.SUCCESS ? (
                <Button className="swap-button border dark:border-dark-200 text-green" icon={checkSvg} />
              ) : (
                <></>
              )}
            </div>
          </div>
        ) : (
          <></>
        )}
        <SwapAmountControl
          asset={toAsset}
          availableAssets={availableToAssets}
          labelKey="market.to"
          value={to}
          setValue={(v) => setTo(v)}
          setAsset={(v) => setToAsset(v)}
          usdRate={accountToMarketRate}
          disabled={false}
          inputDisabled={true}
          selectDisabled={availableToAssets.length <= 1}
        />
        <MarketInfo
          className="mt-4"
          marketRate={marketRate}
          toAsset={toAsset}
          fromAsset={fromAsset}
          usdFromMarketRate={accountFromMarketRate}
        />
        <div>
          {isInvalidFrom ? (
            <Alert appearance="warning" className="mt-4">
              {engineOrderBookState === "insufficient"
                ? i18next.t("market.engine-orderbook-thin")
                : i18next.t("market.invalid-amount")}
            </Alert>
          ) : (
            <></>
          )}
          {engineOrderBookState === "empty" ? (
            <Alert appearance="warning" className="mt-4">
              {i18next.t("market.engine-orderbook-empty")}
            </Alert>
          ) : (
            <></>
          )}
          {tooMuchSlippage ? (
            <Alert appearance="warning" className="mt-4">
              {i18next.t("market.too-much-slippage")}
            </Alert>
          ) : (
            <></>
          )}
          {step === MarketSwapFormStep.FORM ? (
            <Button
              disabled={
                disabled ||
                loading ||
                numberAmount(from) === 0 ||
                isAmountMoreThanBalance ||
                !balance
              }
              className="w-full mt-4"
              onClick={() => submit()}
            >
              {i18next.t("market.continue")}
            </Button>
          ) : (
            <></>
          )}
          {step === MarketSwapFormStep.SIGN ? (
            <SignMethods
              disabled={disabled || loading || numberAmount(from) === 0}
              asset={fromAsset}
              toAsset={toAsset}
              loading={loading}
              setLoading={setLoading}
              fromAmount={from}
              toAmount={to}
              marketRate={marketRate}
              engineTokenPrecision={engineTokenPrecision}
              onSuccess={() => setStep(MarketSwapFormStep.SUCCESS)}
            />
          ) : (
            <></>
          )}
        </div>
      </Form>
      {step === MarketSwapFormStep.SUCCESS ? (
        <MarketSwapFormSuccess
          from={from}
          to={to}
          fromAsset={fromAsset}
          toAsset={toAsset}
          onReset={() => reset()}
        />
      ) : (
        <></>
      )}
    </div>
  );
};
