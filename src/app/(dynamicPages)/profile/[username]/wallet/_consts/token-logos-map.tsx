import { hiveSvg, spkSvg } from "@/features/ui/svg";
import { ReactNode } from "react";
import Image from "next/image";

export const TOKEN_LOGOS_MAP: Record<string, ReactNode> = {
  HIVE: (
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center text-white bg-red">
      {hiveSvg}
    </div>
  ),
  HP: (
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center text-white bg-red">
      {hiveSvg}
    </div>
  ),
  HBD: (
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center text-white bg-green">
      {hiveSvg}
    </div>
  ),
  SPK: (
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center  text-white bg-info-default">
      {spkSvg}
    </div>
  ),
  LARYNX: (
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center  text-white bg-gray-700">
      {spkSvg}
    </div>
  ),
  LP: (
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center text-white bg-gray-700">
      {spkSvg}
    </div>
  ),
  POINTS: (
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center text-gray-600 dark:text-white bg-blue-dark-sky">
      <Image src="/assets/logo.svg" alt="" width={20} height={20} />
    </div>
  )
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
