"use client";

import { getCGMarketApi } from "@/api/coingecko-api";
import { renderToString } from "react-dom/server";
import i18next from "i18next";
import { formattedNumber } from "@/utils";
import React from "react";

export async function renderCurrencies(raw: string): Promise<string> {
  const tokens = [
    ...(raw.toLowerCase().includes("$btc") ? ["$btc"] : []),
    ...(raw.toLowerCase().includes("$leo") ? ["$leo"] : []),
    ...(raw.toLowerCase().includes("$hive") ? ["$hive"] : []),
    ...(raw.toLowerCase().includes("$eth") ? ["$eth"] : [])
  ];
  if (tokens.length > 0) {
    const coins = tokens
      .map((token) => token.replace("$", ""))
      .map((token) => {
        switch (token) {
          case "btc":
            return "binance-wrapped-btc";
          case "eth":
            return "ethereum";
          case "leo":
            return "wrapped-leo";
          default:
            return token;
        }
      })
      .join(",");

    let values;
    try {
      values = await getCGMarketApi(coins, "usd");
    } catch (e) {
      values = tokens.reduce((acc, token) => ({ ...acc, [token]: { usd: "no-data" } }), {});
    }

    Object.entries(values)
      // @ts-ignore
      .map(([key, { usd }]) => {
        switch (key) {
          case "binance-wrapped-btc":
            return [
              ["BTC", usd],
              ["btc", usd]
            ];
          case "ethereum":
            return [
              ["ETH", usd],
              ["eth", usd]
            ];
          case "wrapped-leo":
            return [
              ["LEO", usd],
              ["leo", usd]
            ];
          default:
            return [
              [key.toUpperCase(), usd],
              [key.toLowerCase(), usd]
            ];
        }
      })
      .forEach((tokens) =>
        tokens.forEach(([token, value]) => {
          raw = raw.replaceAll(
            `$${token}`,
            renderToString(
              <span className="markdown-currency">
                <span>{token}</span>
                <span className="value">
                  {value === "no-data"
                    ? i18next.t("decks.columns.no-currency-data")
                    : formattedNumber(value)}
                </span>
              </span>
            )
          );
        })
      );
  }
  return raw;
}
