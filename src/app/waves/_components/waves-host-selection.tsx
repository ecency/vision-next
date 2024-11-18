"use client";

import { TabItem } from "@ui/tabs";
import { useMemo } from "react";
import { AVAILABLE_THREAD_HOSTS } from "@/features/waves";

interface Props {
  host: string;
  setHost: (host: string) => void;
}

export function WavesHostSelection({ host, setHost }: Props) {
  const availableHosts = useMemo(() => ["All", ...AVAILABLE_THREAD_HOSTS], []);

  return (
    <div className="absolute top-[64px] md:top-[69px] z-10 left-0 w-full">
      <div className="max-w-[1600px] mx-auto border-b border-[--border-color] text-sm font-semibold px-4 overflow-x-auto flex items-center justify-around bg-white dark:bg-dark-700 w-full gap-4">
        {availableHosts.map((item, i) => (
          <TabItem
            name={item}
            onSelect={() => setHost(item)}
            title={item}
            i={i}
            key={item}
            isSelected={item === host}
          />
        ))}
      </div>
    </div>
  );
}
