"use client";

import { accountOutlineSvg, starOutlineSvg, ticketSvg } from "@/assets/img/svg";
import { useGlobalStore } from "@/core/global-store";
import {
  accountGroupSvg,
  checkAllSvg,
  chevronUpSvg,
  commentSvg,
  pencilOutlineSvg,
  repeatSvg
} from "@/features/ui/svg";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import defaults from "@/defaults";

export function GetPointsFrame() {
  const ref = useRef<HTMLDivElement>(null);

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 50
  });

  useEffect(() => {
    motionValue.set(3000);
  }, [motionValue]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = "+" + latest.toFixed(0);
        }
      }),
    [springValue]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 128 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, bounce: 0 }}
      className="w-[80%] h-[80%] bg-white mx-auto rounded-t-[4rem] border-t-2 border-x-2 border-[#606060]"
    >
      <div className="w-full h-full rounded-t-[calc(4rem-2px)] border-t-[6px] border-x-[6px] border-[#000000]">
        <div className="flex items-center gap-2 px-2 pb-2 mt-[3rem] border-b border-[--border-color]">
          <div className="flex gap-1 flex-col top-3.5 left-0">
            <span className="w-[20px] h-[2px] bg-gray-400 dark:bg-gray-700"></span>
            <span className="w-[20px] h-[2px] bg-gray-400 dark:bg-gray-700"></span>
            <span className="w-[20px] h-[2px] bg-gray-400 dark:bg-gray-700"></span>
          </div>
          <Image src={defaults.logo} width={32} height={32} alt="" />
        </div>

        <div className="bg-gray-100 border border-[--border-color] dark:bg-gray-900 p-4 rounded-lg m-4">
          <div className="flex justify-between">
            <div className="text-sm">Points</div>
            <div ref={ref} className="text-2xl font-bold" />
          </div>
          <div className="bg-blue-dark-sky inline-flex items-center rounded-lg p-2 text-xs font-semibold gap-2">
            <div className="text-white">+250 POINTS</div>
            <div className="rounded-full bg-white w-6 h-6 flex items-center justify-center">
              <UilPlus className="w-4 h-4" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 [&_svg]:w-5 [&_svg]:h-5 mt-4">
            <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative">
              {pencilOutlineSvg}
              <span className="absolute text-xs bg-blue-dark-sky px-1 rounded-xl -bottom-1 -right-1 text-white">
                15
              </span>
            </div>

            <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative">
              {commentSvg}
              <span className="absolute text-xs bg-blue-dark-sky px-1 rounded-xl -bottom-1 -right-1 text-white">
                5
              </span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative">
              {chevronUpSvg}
              <span className="absolute text-xs bg-blue-dark-sky px-1 rounded-xl -bottom-1 -right-1 text-white">
                0.3
              </span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative">
              {repeatSvg}
              <span className="absolute text-xs bg-blue-dark-sky px-1 rounded-xl -bottom-1 -right-1 text-white">
                1
              </span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative">
              {starOutlineSvg}
              <span className="absolute text-xs bg-blue-dark-sky px-1 rounded-xl -bottom-1 -right-1 text-white">
                0.25
              </span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative">
              {accountOutlineSvg}
              <span className="absolute text-xs bg-blue-dark-sky px-1 rounded-xl -bottom-1 -right-1 text-white">
                10
              </span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative">
              {checkAllSvg}
              <span className="absolute text-xs bg-blue-dark-sky px-1 rounded-xl -bottom-1 -right-1 text-white">
                10
              </span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative">
              {ticketSvg}
              <span className="absolute text-xs bg-blue-dark-sky px-1 rounded-xl -bottom-1 -right-1 text-white">
                10
              </span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative">
              {accountGroupSvg}
              <span className="absolute text-xs bg-blue-dark-sky px-1 rounded-xl -bottom-1 -right-1 text-white">
                20
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
