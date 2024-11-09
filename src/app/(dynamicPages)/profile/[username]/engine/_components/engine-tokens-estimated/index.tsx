import React, { useMemo } from "react";
import i18next from "i18next";
import { HiveEngineToken } from "@/utils";

interface Props {
  tokens: HiveEngineToken[];
}

export const EngineTokensEstimated = ({ tokens }: Props) => {
  const estimated = useMemo(() => {
    if (tokens.length > 0) {
      const totalWalletUsdValue = +tokens
        .map((item) => +item.usdValue)
        .reduce((acc, item) => +(acc + item), 0)
        .toFixed(3);
      return totalWalletUsdValue.toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
      });
    }

    return `${i18next.t("wallet.calculating")}...`;
  }, [tokens]);

  return (
    <div className="balance-row estimated alternative">
      <div className="balance-info">
        <div className="title">{i18next.t("wallet-engine-estimated.title")}</div>
        <div className="description">{i18next.t("wallet-engine-estimated.description")}</div>
      </div>
      <div className="balance-values">
        <div className="amount amount-bold">
          <span> {estimated} </span>
        </div>
      </div>
    </div>
  );
};
