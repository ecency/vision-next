import React from "react";
import { HiveEngineTokenInfo } from "@/entities";
import { Skeleton } from "@/features/shared";
import { formattedNumber } from "@/utils";
import i18next from "i18next";

interface Props {
  token?: HiveEngineTokenInfo;
  loading: boolean;
  symbol: string;
}

export const EngineMarketSummary = ({ token, loading, symbol }: Props) => {
  if (loading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!token) {
    return null;
  }

  return (
    <div className="grid gap-4 rounded border border-border-default p-4 sm:grid-cols-3">
      <div className="flex flex-col">
        <span className="text-xs uppercase text-text-muted">{i18next.t("market.engine.last-price")}</span>
        <span className="text-lg font-semibold">
          {formattedNumber(token.lastPrice)} {"SWAP.HIVE"}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase text-text-muted">{i18next.t("market.engine.price-change")}</span>
        <span
          className={`text-lg font-semibold ${token.priceChangePercent.startsWith("-") ? "text-red" : "text-green"}`}
        >
          {token.priceChangePercent}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase text-text-muted">{i18next.t("market.engine.volume-label", { symbol })}</span>
        <span className="text-lg font-semibold">{formattedNumber(token.volume)}</span>
      </div>
    </div>
  );
};
