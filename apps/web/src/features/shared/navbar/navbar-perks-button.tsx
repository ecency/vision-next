import React from "react";
import { Button } from "@ui/button";
import { UilFire } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

export function NavbarPerksButton() {
  const label = i18next.t("user-nav.perks");
  return (
    <Button
      href="/perks"
      icon={<UilFire />}
      aria-label={label}
      title={label}
      className="font-semibold flex whitespace-nowrap text-sm"
    />
  );
}
