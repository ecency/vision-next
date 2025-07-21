import { hiveSvg, spkSvg } from "@/features/ui/svg";
import { PropsWithChildren, ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";

function LogoBox({
  children,
  size,
  className
}: PropsWithChildren<{ size: number; className: string }>) {
  return (
    <div
      className={clsx("rounded-lg p-1 flex items-center justify-center", className)}
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
  POINTS: getSizedTokenLogo("POINTS", 32)
};

export const TOKEN_COLORS_MAP: Record<string, string> = {
  HIVE: "#e05e5e",
  HP: "#b33f3f",
  HBD: "#69bb84",
  SPK: "#14a2b8",
  LARYNX: "#1c8798",
  LP: "#529fab",
  POINTS: "#357ce6"
};
