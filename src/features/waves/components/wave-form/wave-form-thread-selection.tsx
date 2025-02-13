import React, { useMemo } from "react";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { Button } from "@ui/button";
import i18next from "i18next";
import { UserAvatar } from "@/features/shared";
import { AVAILABLE_THREAD_HOSTS } from "@/features/waves";
import { WaveHosts } from "@/features/waves/enums";

interface Props {
  host: string | undefined;
  setHost: (v: string) => void;
}

export const WaveFormThreadSelection = ({ host, setHost }: Props) => {
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
    <div className="flex items-center gap-1">
      <div className="text-sm opacity-50">{i18next.t("decks.threads-form.thread-host")}</div>
      <Dropdown>
        <DropdownToggle>
          <Button size="sm" appearance="link" noPadding={true}>
            {host ? labels[host] ?? host : i18next.t("decks.threads-form.select-thread-host")}
          </Button>
        </DropdownToggle>
        <DropdownMenu>
          {AVAILABLE_THREAD_HOSTS.filter((v) => v !== "leothreads").map((v) => (
            <DropdownItemWithIcon
              key={v}
              onClick={() => setHost(v)}
              icon={<UserAvatar size="small" username={v} />}
              label={labels[v] ?? v}
            />
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
