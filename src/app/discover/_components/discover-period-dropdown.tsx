"use client";

import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import i18next from "i18next";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { chevronDownSvgForSlider } from "@ui/svg";
import { Button } from "@ui/button";
import { UilSpinner } from "@tooni/iconscout-unicons-react";

export function DiscoverPeriodDropdown() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const params = useSearchParams();

  useEffect(() => {
    if (params?.get("period")) {
      setIsLoading(false);
    }
  }, [params]);

  return (
    <Dropdown>
      <DropdownToggle>
        <Button
          icon={chevronDownSvgForSlider}
          iconPlacement="right"
          size="sm"
          appearance="gray-link"
        >
          {isLoading && <UilSpinner className="w-4 h-4 mr-4 text-blue-dark-sky animate-spin" />}
          {i18next.t("leaderboard.title-stars")}
        </Button>
      </DropdownToggle>
      <DropdownMenu align="right">
        {["day", "week", "month"].map((f) => (
          <DropdownItem
            key={f}
            onClick={() => {
              setIsLoading(true);
              router.push(`/discover?period=${f}`, { scroll: false });
            }}
          >
            {i18next.t(`leaderboard.period-${f}`)}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
