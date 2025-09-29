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
        "rounded-lg p-1 flex items-center justify-center",
        className ?? "border border-[--border-color]"
      )}
      style={{
        minWidth: size,
        maxWidth: size,
        height: size
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
  }
}

export const TOKEN_LOGOS_MAP: Record<string, ReactNode> = {
  HIVE: getSizedTokenLogo("HIVE", 32),
  HP: getSizedTokenLogo("HP", 32),
  HBD: getSizedTokenLogo("HBD", 32),
  SPK: getSizedTokenLogo("SPK", 32),
  LARYNX: getSizedTokenLogo("LARYNX", 32),
  LP: getSizedTokenLogo("LP", 32),
  POINTS: getSizedTokenLogo("POINTS", 32),
  APT: (
    <LogoBox size={32}>
      <Image width={24} height={24} src={CURRENCIES_META_DATA.APT.icon} alt="" />
    </LogoBox>
  ),
  ATOM: (
    <LogoBox size={32}>
      <Image width={24} height={24} src={CURRENCIES_META_DATA.ATOM.icon} alt="" />
    </LogoBox>
  ),
  BTC: (
    <LogoBox size={32}>
      <Image width={32} height={32} src={CURRENCIES_META_DATA.BTC.icon} alt="" />
    </LogoBox>
  ),
  ETH: (
    <LogoBox size={32}>
      <Image width={24} height={24} src={CURRENCIES_META_DATA.ETH.icon} alt="" className="h-6" />
    </LogoBox>
  ),
  SOL: (
    <LogoBox size={32}>
      <Image width={24} height={24} src={CURRENCIES_META_DATA.SOL.icon} alt="" />
    </LogoBox>
  ),
  TON: (
    <LogoBox size={32}>
      <Image width={24} height={24} src={CURRENCIES_META_DATA.TON.icon} alt="" />
    </LogoBox>
  ),
  TRX: (
    <LogoBox size={32}>
      <Image width={24} height={24} src={CURRENCIES_META_DATA.TRX.icon} alt="" />
    </LogoBox>
  )
};

export const TOKEN_COLORS_MAP: Record<string, string> = {
  HIVE: "bg-gradient-to-r from-[#e05e5e] to-[#e05e5e]/60",
  HP: "bg-gradient-to-r from-[#e05e5e] to-[#e05e5e]/60",
  HBD: "bg-gradient-to-r from-[#69bb84] to-[#69bb84]/60",
  SPK: "bg-gradient-to-r from-[#14a2b8] to-[#14a2b8]/60",
  LARYNX: "bg-gradient-to-r from-[#1c8798] to-[#1c8798]/60",
  LP: "bg-gradient-to-r from-[#529fab] to-[#529fab]/60",
  POINTS: "bg-gradient-to-r from-[#357ce6] to-[#357ce6]/60"
};
