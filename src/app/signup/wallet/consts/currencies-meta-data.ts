import aptSvg from "@/assets/img/currencies/apt.svg";
import atomSvg from "@/assets/img/currencies/atom.svg";
import btcSvg from "@/assets/img/currencies/btc.svg";
import ethSvg from "@/assets/img/currencies/eth.svg";
import solSvg from "@/assets/img/currencies/solana.svg";
import tonSvg from "@/assets/img/currencies/ton.svg";
import tronSvg from "@/assets/img/currencies/tron.svg";
import { ExternalWalletCurrency } from "@/enums";

export const CURRENCIES_META_DATA = {
  [ExternalWalletCurrency.BTC]: {
    title: "Bitcoin",
    icon: btcSvg,
    name: "BTC"
  },
  [ExternalWalletCurrency.ETH]: {
    title: "Etherium",
    icon: ethSvg,
    name: "ETH"
  },
  [ExternalWalletCurrency.TRON]: {
    title: "Tron",
    icon: tronSvg,
    name: "TRX"
  },
  [ExternalWalletCurrency.TON]: {
    title: "Ton",
    icon: tonSvg,
    name: "TON"
  },
  [ExternalWalletCurrency.SOL]: {
    title: "Solana",
    icon: solSvg,
    name: "SOL"
  },
  [ExternalWalletCurrency.ATOM]: {
    title: "ATOM Cosmos",
    icon: atomSvg,
    name: "ATOM"
  },
  [ExternalWalletCurrency.APT]: {
    title: "Aptos",
    icon: aptSvg,
    name: "APT"
  }
} as const;
