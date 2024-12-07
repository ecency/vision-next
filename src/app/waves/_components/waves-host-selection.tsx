import { useMemo } from "react";
import { AVAILABLE_THREAD_HOSTS } from "@/features/waves";
import { WavesNavigationLayout } from "@/app/waves/_components/waves-navigation-layout";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { Button } from "@ui/button";
import { UilApps } from "@tooni/iconscout-unicons-react";
import { UserAvatar } from "@/features/shared";

interface Props {
  host: string;
  setHost: (host: string) => void;
}

export function WavesHostSelection({ host, setHost }: Props) {
  const availableHosts = useMemo(() => ["All", ...AVAILABLE_THREAD_HOSTS], []);

  return (
    <WavesNavigationLayout>
      <div />
      <Dropdown>
        <DropdownToggle>
          <Button icon={<UilApps />} appearance="gray-link">
            {host}
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
              label={item}
            />
          ))}
        </DropdownMenu>
      </Dropdown>
    </WavesNavigationLayout>
  );
}
