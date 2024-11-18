import { AVAILABLE_THREAD_HOSTS, WaveForm } from "@/features/waves";
import { TabItem } from "@ui/tabs";
import { useMemo } from "react";
import i18next from "i18next";

interface Props {
  host: string;
  setHost: (host: string) => void;
}

export function WavesCreateCard({ host, setHost }: Props) {
  const availableHosts = useMemo(() => ["All", ...AVAILABLE_THREAD_HOSTS], []);

  return (
    <div className="rounded-2xl bg-white dark:bg-dark-200 mb-4 lg:mb-6 xl:mb-8">
      <div className="px-4 py-4 pb-2 text-xs uppercase font-semibold opacity-50">
        {i18next.t("waves.sources")}
      </div>
      <div className="border-b border-[--border-color] text-sm font-semibold px-4 overflow-x-auto flex items-center justify-between">
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
      <WaveForm entry={undefined} />
    </div>
  );
}
