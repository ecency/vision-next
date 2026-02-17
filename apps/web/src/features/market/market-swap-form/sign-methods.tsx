import {
  buildEngineSwapPayload,
  getMarketSwappingMethods,
  swapByHs,
  swapByKc,
  swapByKey,
  SwappingMethod
} from "./api/swapping";
import React, { useState } from "react";
import { HiveMarketAsset, MarketAsset, isEnginePair, isHiveMarketAsset } from "./market-pair";
import { SignByKey } from "./sign-by-key";
import { PrivateKey } from "@hiveio/dhive";
import { HiveMarket } from "./api/hive";
import { EngineMarket } from "./api/engine";
import { Button } from "@ui/button";
import { error } from "@/features/shared";
import { formatError } from "@/api/format-error";
import i18next from "i18next";
import { hsLogoSvg, kcLogoSvg } from "@ui/svg";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateWalletQueries } from "@/features/wallet/utils/invalidate-wallet-queries";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useEngineMarketOrderMutation } from "@/api/sdk-mutations";

export interface Props {
  disabled: boolean;
  fromAmount: string;
  toAmount: string;
  marketRate: number;
  asset: MarketAsset;
  toAsset: MarketAsset;
  loading: boolean;
  engineTokenPrecision?: number;
  setLoading: (value: boolean) => void;
  onSuccess: () => void;
}

export const SignMethods = ({
  disabled,
  fromAmount,
  toAmount,
  asset,
  toAsset,
  loading,
  setLoading,
  engineTokenPrecision,
  onSuccess
}: Props) => {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();
  const activeUsername = activeUser?.username;

  const [showSignByKey, setShowSignByKey] = useState(false);
  const [isSignByKeyLoading, setIsSignByKeyLoading] = useState(false);
  const [isSignByHsLoading, setIsSignByHsLoading] = useState(false);

  const { mutateAsync: placeEngineOrder, isPending: isEngineOrderPending } = useEngineMarketOrderMutation();

  // Engine pairs: single button using SDK mutation (handles auth automatically)
  const onEngineSwap = async () => {
    setLoading(true);
    try {
      const amount = await EngineMarket.getNewAmount(toAmount, fromAmount, asset, toAsset, engineTokenPrecision);
      const payload = buildEngineSwapPayload({
        activeUser,
        fromAsset: asset,
        toAsset,
        fromAmount,
        toAmount: amount,
        engineTokenPrecision
      });

      if (!payload) {
        throw new Error("Invalid engine swap configuration");
      }

      await placeEngineOrder(payload);
      invalidateWalletQueries(queryClient, activeUsername);
      onSuccess();
    } catch (e) {
      error(...formatError(e));
    } finally {
      setLoading(false);
    }
  };

  // HIVE/HBD pairs: existing Key/HS/KC methods
  const onSwapByHs = async () => {
    swapByHs({
      activeUser,
      fromAsset: asset,
      toAsset,
      fromAmount,
      toAmount,
      engineTokenPrecision
    });
  };

  const onSwapByKey = async (key: PrivateKey) => {
    setIsSignByKeyLoading(true);
    try {
      await swapAction((toAmount) =>
        swapByKey(key, {
          activeUser,
          fromAsset: asset,
          toAsset,
          fromAmount,
          toAmount,
          engineTokenPrecision
        })
      );
    } finally {
      setIsSignByKeyLoading(false);
    }
  };

  const onSwapByKc = async () => {
    setIsSignByHsLoading(true);
    try {
      await swapAction((toAmount) =>
        swapByKc({
          activeUser,
          fromAsset: asset,
          toAsset,
          fromAmount,
          toAmount,
          engineTokenPrecision
        })
      );
    } finally {
      setIsSignByHsLoading(false);
    }
  };

  const swapAction = async (action: (toAmount: string) => Promise<any>) => {
    setLoading(true);
    try {
      let amount = toAmount;

      if (isHiveMarketAsset(asset)) {
        amount = await HiveMarket.getNewAmount(toAmount, fromAmount, asset as HiveMarketAsset);
      }

      await action(amount);
      invalidateWalletQueries(queryClient, activeUsername);
      onSuccess();
    } catch (e) {
      error(...formatError(e));
    } finally {
      setLoading(false);
    }
  };

  const methods = getMarketSwappingMethods(asset, toAsset);

  return (
    <div>
      {/* Engine pairs: single unified button */}
      {methods.includes(SwappingMethod.CUSTOM) && (
        <Button
          disabled={disabled || isEngineOrderPending}
          className="w-full mt-4"
          onClick={onEngineSwap}
        >
          {loading || isEngineOrderPending
            ? i18next.t("market.signing")
            : i18next.t("market.swap-title")}
        </Button>
      )}

      {/* HIVE/HBD pairs: Key/HS/KC buttons */}
      {showSignByKey ? (
        <SignByKey
          isLoading={isSignByKeyLoading}
          onKey={(key) => onSwapByKey(key)}
          onBack={() => setShowSignByKey(false)}
        />
      ) : (
        <>
          {methods.includes(SwappingMethod.KEY) ? (
            <Button
              disabled={disabled}
              outline={true}
              className="w-full mt-4"
              onClick={() => setShowSignByKey(true)}
            >
              {i18next.t("market.swap-by", { method: "key" })}
            </Button>
          ) : (
            <></>
          )}
          {methods.includes(SwappingMethod.HS) ? (
            <Button disabled={disabled} className="w-full mt-4 hs-button" onClick={onSwapByHs}>
              <i className="sign-logo mr-3">{hsLogoSvg}</i>
              {i18next.t("market.swap-by", { method: "Hivesigner" })}
            </Button>
          ) : (
            <></>
          )}
          {methods.includes(SwappingMethod.KC) ? (
            <Button disabled={disabled} className="w-full mt-4 kc-button" onClick={onSwapByKc}>
              <i className="sign-logo mr-3">{kcLogoSvg}</i>
              {isSignByHsLoading
                ? i18next.t("market.signing")
                : i18next.t("market.swap-by", { method: "Keychain" })}
            </Button>
          ) : (
            <></>
          )}
        </>
      )}
    </div>
  );
};
