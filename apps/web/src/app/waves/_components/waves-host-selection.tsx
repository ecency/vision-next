import { useMemo } from "react";
import { AVAILABLE_THREAD_HOSTS, WAVE_HOST_LABELS } from "@/features/waves";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { Button } from "@ui/button";
import { UilApps } from "@tooni/iconscout-unicons-react";
import { UserAvatar } from "@/features/shared";

interface Props {
  host: string;
  setHost: (host: string) => void;
}

export function WavesHostSelection({ host, setHost }: Props) {
  const availableHosts = useMemo(() => [...AVAILABLE_THREAD_HOSTS], []);
  const labels = useMemo(() => WAVE_HOST_LABELS, []);

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
