import { TabItem } from "@ui/tabs";
import { useMemo } from "react";
import { AVAILABLE_THREAD_HOSTS } from "@/features/waves";
import { WavesNavigationLayout } from "@/app/waves/_components/waves-navigation-layout";

interface Props {
  host: string;
  setHost: (host: string) => void;
}

export function WavesHostSelection({ host, setHost }: Props) {
  const availableHosts = useMemo(() => ["All", ...AVAILABLE_THREAD_HOSTS], []);

  return (
    <WavesNavigationLayout>
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
    </WavesNavigationLayout>
  );
}
