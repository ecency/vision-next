import Image from "next/image";
import { useMemo } from "react";
import { arrangeSunflowerSeeds } from "./utils/sunflower-seed-arrangement";
import clsx from "clsx";
import defaults from "@/defaults";

interface Props {
  options: number[];
  destination: number | undefined;
  startSpin: boolean;
}

export function PointsSpin({ options, destination, startSpin }: Props) {
  const points = useMemo(() => arrangeSunflowerSeeds(options, 144, 80), [options]);
  const collapse = startSpin || !!destination;

  return (
    <div className="flex relative items-center justify-center min-w-[288] min-h-[288px]">
      <div className={clsx("absolute z-10", startSpin && "animate-[spin_6s_linear_infinite]")}>
        <Image
          src={defaults.logo}
          width={96}
          height={96}
          alt=""
          className="p-2 bg-white rounded-full "
        />
      </div>
      {points.map((option, i) => (
        <div
          key={i}
          className={clsx(
            "absolute z-1 transition-transform duration-1000 ease-in",
            option.label >= 0 && option.label <= 9 && "text-xs text-gray-600 dark:text-gray-400",
            option.label >= 10 && option.label <= 99 && "text-sm text-gray-700 dark:text-gray-300",
            option.label >= 100 &&
              option.label <= 999 &&
              "text-lg font-semibold text-blue-dark-sky"
          )}
          style={{
            transform: collapse ? "translate(0, 0)" : `translate(${option.x}px, ${option.y}px)`
          }}
        >
          <div
            className={clsx(!collapse && "animate-[anim-drift_8s_linear_infinite]")}
            style={{ animationDelay: `${-(i % 8)}s` }}
          >
            {option.label}
          </div>
        </div>
      ))}

      <div
        className={clsx(
          "p-2 bg-gradient-to-br from-gray-400 to-gray-200 rounded-full",
          startSpin
            ? "animate-[spin_3s_linear_infinite_reverse]"
            : "animate-[spin_16s_linear_infinite_reverse]"
        )}
      >
        <div className="p-2 bg-white rounded-full">
          <div
            className={clsx(
              "p-2 bg-gradient-to-tr from-blue-dark-sky to-gray-200 rounded-full",
              startSpin
                ? "animate-[spin_0.5s_linear_infinite_reverse]"
                : "animate-[spin_6s_linear_infinite_reverse]"
            )}
          >
            <div className="w-[96px] h-[96px] p-2 rounded-full"></div>
          </div>
        </div>
      </div>

      {destination && (
        <div className="animate-scale-in absolute bg-blue-dark-sky bg-opacity-75 backdrop-blur-md rounded-2xl z-10 p-4 text-center text-white">
          <div>You won points</div>
          <div className="font-bold text-6xl">{destination}</div>
        </div>
      )}
    </div>
  );
}
