"use client";

import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import i18next from "i18next";
import React from "react";
import { useRouter } from "next/navigation";
import { chevronDownSvgForSlider } from "@ui/svg";
import { Button } from "@ui/button";

export function DiscoverPeriodDropdown() {
  const router = useRouter();
  return (
    <Dropdown>
      <DropdownToggle>
        <Button
          icon={chevronDownSvgForSlider}
          iconPlacement="right"
          size="sm"
          appearance="gray-link"
        >
          {i18next.t("leaderboard.title-stars")}
        </Button>
      </DropdownToggle>
      <DropdownMenu align="right">
        {["day", "week", "month"].map((f) => (
          <DropdownItem key={f} onClick={() => router.push(`/discover?period=${f}`)}>
            {i18next.t(`leaderboard.period-${f}`)}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
