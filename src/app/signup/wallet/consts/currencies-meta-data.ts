import aptSvg from "@/assets/img/currencies/apt.svg";
import atomSvg from "@/assets/img/currencies/atom.svg";
import btcSvg from "@/assets/img/currencies/btc.svg";
import ethSvg from "@/assets/img/currencies/eth.svg";
import solSvg from "@/assets/img/currencies/solana.svg";
import tonSvg from "@/assets/img/currencies/ton.svg";
import tronSvg from "@/assets/img/currencies/tron.svg";
import { EcencyWalletCurrency } from "@ecency/wallets";

export const CURRENCIES_META_DATA = {
  [EcencyWalletCurrency.BTC]: {
    title: "Bitcoin",
    icon: btcSvg,
    name: "BTC"
  },
  [EcencyWalletCurrency.ETH]: {
    title: "Ethereum",
    icon: ethSvg,
    name: "ETH"
  },
  [EcencyWalletCurrency.TRON]: {
    title: "Tron",
    icon: tronSvg,
    name: "TRX"
  },
  [EcencyWalletCurrency.TON]: {
    title: "Ton",
    icon: tonSvg,
    name: "TON"
  },
  [EcencyWalletCurrency.SOL]: {
    title: "Solana",
    icon: solSvg,
    name: "SOL"
  },
  [EcencyWalletCurrency.APT]: {
    title: "Aptos",
    icon: aptSvg,
    name: "APT"
  }
} as const;
