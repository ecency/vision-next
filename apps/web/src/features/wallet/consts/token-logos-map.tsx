import { hiveSvg, spkSvg } from "@/features/ui/svg";
import { PropsWithChildren, ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";
import { CURRENCIES_META_DATA } from "./currencies-meta-data";

function LogoBox({
  children,
  size,
  className
}: PropsWithChildren<{ size: number; className?: string }>) {
  return (
    <div
      className={clsx(
        "rounded-lg p-1 flex items-center justify-center [&_svg]:h-full [&_svg]:w-full",
        className ?? "border border-[--border-color]"
      )}
      style={{
        minWidth: size,
        maxWidth: size,
        height: size,
        width: size
      }}
    >
      {children}
    </div>
  );
}

export function getSizedTokenLogo(token: string, size = 32) {
  switch (token) {
    case "HIVE":
    case "HP":
      return (
        <LogoBox size={size} className="text-white bg-red">
          {hiveSvg}
        </LogoBox>
      );
    case "HBD":
      return (
        <LogoBox size={size} className="text-white bg-green">
          {hiveSvg}
        </LogoBox>
      );
    case "SPK":
      return (
        <LogoBox size={size} className="text-white bg-info-default">
          {spkSvg}
        </LogoBox>
      );
    case "LARYNX":
    case "LP":
      return (
        <LogoBox size={size} className="text-white bg-gray-700">
          {spkSvg}
        </LogoBox>
      );
    case "POINTS":
    default:
      return (
        <LogoBox size={size} className="bg-blue-dark-sky">
          <Image src="/assets/logo.svg" alt="" width={20} height={20} />
        </LogoBox>
      );
    case "APT":
      return (
        <LogoBox size={size}>
          <Image width={24} height={24} src={CURRENCIES_META_DATA.APT.icon} alt="" />
        </LogoBox>
      );
    case "BTC":
      return (
        <LogoBox size={size}>
          <Image width={32} height={32} src={CURRENCIES_META_DATA.BTC.icon} alt="" />
        </LogoBox>
      );
    case "BNB":
      return (
        <LogoBox size={size}>
          <Image width={32} height={32} src={CURRENCIES_META_DATA.BNB.icon} alt="" />
        </LogoBox>
      );
    case "ETH":
      return (
        <LogoBox size={size}>
          <Image
            width={24}
            height={24}
            src={CURRENCIES_META_DATA.ETH.icon}
            alt=""
            className="h-6"
          />
        </LogoBox>
      );
    case "SOL":
      return (
        <LogoBox size={size}>
          <Image width={24} height={24} src={CURRENCIES_META_DATA.SOL.icon} alt="" />
        </LogoBox>
      );
    case "TON":
      return (
        <LogoBox size={size}>
          <Image width={24} height={24} src={CURRENCIES_META_DATA.TON.icon} alt="" />
        </LogoBox>
      );
    case "TRX":
      return (
        <LogoBox size={size}>
          <Image width={24} height={24} src={CURRENCIES_META_DATA.TRX.icon} alt="" />
        </LogoBox>
      );
  }
}

const TOKEN_LOGO_ALIASES: Record<string, string> = {
  "HIVE POWER": "HP",
  "HIVE DOLLARS": "HBD",
  POINT: "POINTS"
};

export function resolveTokenLogoKey(token: string): string {
  const normalized = token.trim().toUpperCase();
  const alias = TOKEN_LOGO_ALIASES[normalized];
  return (alias ?? normalized) as string;
}

export function getTokenLogo(token: string, size = 32) {
  const key = resolveTokenLogoKey(token);
  return getSizedTokenLogo(key, size);
}

const TOKEN_LOGO_PRESETS = [
  "HIVE",
  "HP",
  "HIVE POWER",
  "HBD",
  "HIVE DOLLARS",
  "SPK",
  "LARYNX",
  "LP",
  "POINTS",
  "POINT",
  "APT",
  "BTC",
  "BNB",
  "ETH",
  "SOL",
  "TON",
  "TRX"
] as const;

export const TOKEN_LOGOS_MAP: Record<string, ReactNode> = TOKEN_LOGO_PRESETS.reduce(
  (acc, token) => {
    const key = resolveTokenLogoKey(token);
    const logo = getSizedTokenLogo(key, 32);

    acc[token] = logo;
    acc[key] = logo;
    acc[token.toLowerCase()] = logo;

    return acc;
  },
  {} as Record<string, ReactNode>
);

export const TOKEN_COLORS_MAP: Record<string, string> = {
  HIVE: "bg-gradient-to-r from-[#e05e5e] to-[#e05e5e]/60",
  HP: "bg-gradient-to-r from-[#e05e5e] to-[#e05e5e]/60",
  HBD: "bg-gradient-to-r from-[#69bb84] to-[#69bb84]/60",
  SPK: "bg-gradient-to-r from-[#14a2b8] to-[#14a2b8]/60",
  LARYNX: "bg-gradient-to-r from-[#1c8798] to-[#1c8798]/60",
  LP: "bg-gradient-to-r from-[#529fab] to-[#529fab]/60",
  POINTS: "bg-gradient-to-r from-[#357ce6] to-[#357ce6]/60",
  APT: "bg-gradient-to-r from-[#06F7F7] to-[#06F7F7]/60",
  BNB: "bg-gradient-to-r from-[#f7931a] to-[#f7931a]/60",
  BTC: "bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/60",
  ETH: "bg-gradient-to-r from-[#c6c5d4] to-[#c6c5d4]/60",
  SOL: "bg-gradient-to-r from-[#9945FF] to-[#14F195]/60",
  TON: "bg-gradient-to-r from-[#0098EA] to-[#0098EA]/60",
  TRX: "bg-gradient-to-r from-[#dd2200] to-[#dd2200]/60"
};
