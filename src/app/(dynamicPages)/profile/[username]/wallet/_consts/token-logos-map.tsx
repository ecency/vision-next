import { hiveEngineSvg, hiveSvg, spkSvg } from "@/features/ui/svg";
import { ReactNode } from "react";

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
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center text-white bg-blue-dark-sky">
      {spkSvg}
    </div>
  ),
  LARYNX: (
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center text-gray-600 dark:text-white bg-gray-400 dark:bg-gray-700">
      {spkSvg}
    </div>
  ),
  LP: (
    <div className="rounded-lg p-1 min-w-[2rem] max-w-[2rem] h-[2rem] flex items-center justify-center text-gray-600 dark:text-white bg-gray-400 dark:bg-gray-700">
      {spkSvg}
    </div>
  )
};
