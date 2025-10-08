"use client";

import { useGlobalStore } from "@/core/global-store";
import { EcencyWalletCurrency } from "@ecency/wallets";
import { memo, useEffect, useRef } from "react";

interface Props {
  symbol: string;
}

const Symbols: Record<string, string> = {
  [EcencyWalletCurrency.APT]: "COINBASE:APTUSD",
  [EcencyWalletCurrency.BNB]: "BINANCE:BNBUSD",
  [EcencyWalletCurrency.BTC]: "COINBASE:BTCUSD",
  [EcencyWalletCurrency.ETH]: "COINBASE:ETHUSD",
  [EcencyWalletCurrency.SOL]: "COINBASE:SOLUSD",
  [EcencyWalletCurrency.TON]: "CRYPTO:TONUSD",
  [EcencyWalletCurrency.TRON]: "TRADENATION:TRONUSD"
};

export function TradingViewWidget({ symbol }: Props) {
  const container = useRef<HTMLDivElement>(null);

  const locale = useGlobalStore((s) => s.lang);
  const theme = useGlobalStore((s) => s.theme);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
        {
          "allow_symbol_change": false,
          "calendar": false,
          "details": false,
          "hide_side_toolbar": true,
          "hide_top_toolbar": true,
          "hide_legend": false,
          "hide_volume": false,
          "hotlist": false,
          "interval": "D",
          "locale": "${locale}",
          "save_image": true,
          "style": "1",
          "symbol": "${Symbols[symbol]}",
          "theme": "${theme === "day" ? "light" : "dark"}",
          "timezone": "Etc/UTC",
          "backgroundColor": "#ffffff",
          "gridColor": "rgba(46, 46, 46, 0.06)",
          "watchlist": [],
          "withdateranges": false,
          "compareSymbols": [],
          "studies": [],
          "autosize": true
        }`;
    if (container.current?.children.length) {
      container.current.innerHTML = "";
    }
    container.current?.appendChild(script);
  }, [locale, symbol, theme]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: "100%", width: "100%" }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: "calc(100% - 32px)", width: "100%" }}
      ></div>
      <div className="tradingview-widget-copyright">
        <a
          href="https://www.tradingview.com/symbols/BTCUSD/?exchange=COINBASE"
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="blue-text">BTCUSD chart</span>
        </a>
        <span className="trademark"> by TradingView</span>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
