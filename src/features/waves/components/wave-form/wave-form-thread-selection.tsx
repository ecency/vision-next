import React from "react";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { Button } from "@ui/button";
import i18next from "i18next";
import { UserAvatar } from "@/features/shared";
import { AVAILABLE_THREAD_HOSTS } from "@/app/decks/_components/consts";
import { UilArrowDown } from "@tooni/iconscout-unicons-react";

interface Props {
  host: string | undefined;
  setHost: (v: string) => void;
}

export const WaveFormThreadSelection = ({ host, setHost }: Props) => {
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm opacity-50">{i18next.t("decks.threads-form.thread-host")}</div>
      <Dropdown>
        <DropdownToggle>
          <Button size="sm" outline={true} icon={<UilArrowDown className="w-3 h-3" />}>
            @{host ? host : i18next.t("decks.threads-form.select-thread-host")}
          </Button>
        </DropdownToggle>
        <DropdownMenu>
          {AVAILABLE_THREAD_HOSTS.filter((v) => v !== "leothreads").map((v) => (
            <DropdownItemWithIcon
              key={v}
              onClick={() => setHost(v)}
              icon={<UserAvatar size="small" username={v} />}
              label={v}
            />
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
