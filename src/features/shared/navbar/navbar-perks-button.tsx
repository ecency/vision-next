import React from "react";
import { Button } from "@ui/button";
import { UilFire } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

export function NavbarPerksButton() {
  return (
    <Button
      href="/perks"
      icon={<UilFire />}
      className="font-semibold flex whitespace-nowrap text-sm"
    >
      {i18next.t("user-nav.perks")}
    </Button>
  );
}
