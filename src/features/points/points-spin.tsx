import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";
import { arrangeSunflowerSeeds } from "./utils/sunflower-seed-arrangement";
import clsx from "clsx";

interface Props {
  options: number[];
  destination: string | undefined;
  startSpin: boolean;
  onSpinComplete: (destination: string | undefined) => void;
}

export function PointsSpin({ options, destination, startSpin, onSpinComplete }: Props) {
  const points = useMemo(() => arrangeSunflowerSeeds(options, 144, 80), [options]);

  return (
    <div className="flex relative items-center justify-center min-w-[288] min-h-[288px]">
      <Image
        src="/assets/logo-circle.svg"
        width={96}
        height={96}
        alt=""
        className="p-2 bg-white rounded-full absolute z-10"
      />
      <AnimatePresence>
        {points.map((option, i) => (
          <motion.div
            key={i}
            className={clsx(
              "absolute z-1",
              option.label >= 0 && option.label <= 9 && "text-xs text-gray-600 dark:text-gray-400",
              option.label >= 10 &&
                option.label <= 99 &&
                "text-sm text-gray-700 dark:text-gray-300",
              option.label >= 100 &&
                option.label <= 999 &&
                "text-lg font-semibold text-blue-dark-sky"
            )}
            animate={{
              x: startSpin
                ? [option.x, 0]
                : [
                    option.x,
                    option.x + Math.random() * 6 * (Math.random() < 0.5 ? -1 : 1),
                    option.x + Math.random() * 6 * (Math.random() < 0.5 ? -1 : 1),
                    option.x
                  ],
              y: startSpin
                ? [option.y, 0]
                : [
                    option.y,
                    option.y + Math.random() * 6 * (Math.random() < 0.5 ? -1 : 1),
                    option.y + Math.random() * 6 * (Math.random() < 0.5 ? -1 : 1),
                    option.y
                  ]
            }}
            transition={{
              duration: startSpin ? 1 : 8,
              repeat: startSpin ? 0 : Infinity,
              ease: startSpin ? "easeIn" : "linear"
            }}
          >
            {option.label}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        animate={{ rotate: [0, -360] }}
        transition={{ repeat: Infinity, duration: startSpin ? 3 : 16, ease: "linear" }}
        className="p-2 bg-gradient-to-br from-gray-400 to-gray-200 rounded-full"
      >
        <div className="p-2 bg-white rounded-full">
          <motion.div
            animate={{ rotate: [0, -720] }}
            transition={{ repeat: Infinity, duration: startSpin ? 1 : 12, ease: "linear" }}
            className="p-2 bg-gradient-to-tr from-blue-dark-sky to-gray-200 rounded-full"
          >
            <div className="w-[96px] h-[96px] p-2 rounded-full"></div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
