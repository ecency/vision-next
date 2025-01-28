import { useMemo } from "react";
import { AVAILABLE_THREAD_HOSTS } from "@/features/waves";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { Button } from "@ui/button";
import { UilApps } from "@tooni/iconscout-unicons-react";
import { UserAvatar } from "@/features/shared";
import { WaveHosts } from "@/features/waves/enums";

interface Props {
  host: string;
  setHost: (host: string) => void;
}

export function WavesHostSelection({ host, setHost }: Props) {
  const availableHosts = useMemo(() => [...AVAILABLE_THREAD_HOSTS], []);
  const labels = useMemo(
    () =>
      ({
        [WaveHosts.Waves]: "Waves",
        [WaveHosts.Leo]: "Threads",
        [WaveHosts.Dbuzz]: "Buzz",
        [WaveHosts.Liketu]: "Moments",
        [WaveHosts.PeakSnaps]: "Snaps"
      }) as Record<string, string>,
    []
  );

  return (
    <Dropdown>
      <DropdownToggle>
        <Button icon={<UilApps />} appearance="gray-link">
          {labels[host] ?? host}
        </Button>
      </DropdownToggle>
      <DropdownMenu align="right">
        {availableHosts.map((item, i) => (
          <DropdownItemWithIcon
            icon={<UserAvatar username={item} size="small" />}
            name={item}
            onClick={() => setHost(item)}
            title={item}
            key={item}
            label={labels[item] ?? item}
          />
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
