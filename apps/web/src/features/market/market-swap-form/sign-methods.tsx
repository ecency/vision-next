import {
  buildEngineSwapPayload,
  buildHiveSwapPayload,
  getMarketSwappingMethods,
  SwappingMethod
} from "./api/swapping";
import React from "react";
import { MarketAsset, isHiveMarketAsset, HiveMarketAsset } from "./market-pair";
import { HiveMarket } from "./api/hive";
import { EngineMarket } from "./api/engine";
import { Button } from "@ui/button";
import { error } from "@/features/shared";
import { formatError } from "@/api/format-error";
import i18next from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateWalletQueries } from "@/features/wallet/utils/invalidate-wallet-queries";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useEngineMarketOrderMutation, useLimitOrderCreateMutation } from "@/api/sdk-mutations";

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

  const { mutateAsync: placeEngineOrder, isPending: isEngineOrderPending } = useEngineMarketOrderMutation();
  const { mutateAsync: placeLimitOrder, isPending: isLimitOrderPending } = useLimitOrderCreateMutation();

  // Engine pairs: single button using SDK mutation (handles auth automatically)
  const onEngineSwap = async () => {
    setLoading(true);
    try {
      const amount = await EngineMarket.getNewAmount(toAmount, fromAmount, asset, toAsset, engineTokenPrecision);
      const payload = buildEngineSwapPayload({
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

  // HIVE/HBD pairs: unified SDK mutation (handles Key/HS/KC/HiveAuth automatically)
  const onHiveSwap = async () => {
    setLoading(true);
    try {
      let amount = toAmount;

      if (isHiveMarketAsset(asset)) {
        amount = await HiveMarket.getNewAmount(toAmount, fromAmount, asset as HiveMarketAsset);
      }

      const payload = buildHiveSwapPayload({
        fromAsset: asset,
        toAsset,
        fromAmount,
        toAmount: amount
      });

      if (!payload) {
        throw new Error("Invalid HIVE/HBD swap configuration");
      }

      await placeLimitOrder(payload);
      invalidateWalletQueries(queryClient, activeUsername);
      onSuccess();
    } catch (e) {
      error(...formatError(e));
    } finally {
      setLoading(false);
    }
  };

  const methods = getMarketSwappingMethods(asset, toAsset);
  const isSwapping = loading || isLimitOrderPending || isEngineOrderPending;

  return (
    <div>
      {/* Engine pairs: single unified button */}
      {methods.includes(SwappingMethod.CUSTOM) && (
        <Button
          disabled={disabled || isEngineOrderPending}
          className="w-full mt-4"
          onClick={onEngineSwap}
        >
          {isSwapping
            ? i18next.t("market.signing")
            : i18next.t("market.swap-title")}
        </Button>
      )}

      {/* HIVE/HBD pairs: unified swap button (SDK mutation handles auth method) */}
      {methods.includes(SwappingMethod.HIVE) && (
        <Button
          disabled={disabled || isLimitOrderPending}
          className="w-full mt-4"
          onClick={onHiveSwap}
        >
          {isSwapping
            ? i18next.t("market.signing")
            : i18next.t("market.swap-title")}
        </Button>
      )}
    </div>
  );
};
