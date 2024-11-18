import { AVAILABLE_THREAD_HOSTS, WaveForm } from "@/features/waves";
import { TabItem } from "@ui/tabs";
import { useMemo } from "react";

export function WavesCreateCard() {
  const availableHosts = useMemo(() => ["All", ...AVAILABLE_THREAD_HOSTS], []);

  return (
    <div className="rounded-2xl bg-white dark:bg-dark-200 mb-4 lg:mb-6 xl:mb-8">
      <div className="border-b border-[--border-color] text-sm font-semibold px-4 overflow-x-auto flex items-center justify-between">
        {availableHosts.map((host, i) => (
          <TabItem
            name={host}
            onSelect={() => {}}
            title={host}
            i={i}
            key={host}
            isSelected={false}
          />
        ))}
      </div>
      <WaveForm entry={undefined} />
    </div>
  );
}
