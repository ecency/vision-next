"use client";

import i18next from "i18next";
import Link from "next/link";
import { Button } from "@/features/ui";

interface Props {
  username: string;
}

/**
 * Shown when a non-Pro viewer opens someone else's Insights. Own insights stay free; viewing
 * any other creator's traffic is an Ecency Pro perk, so this is the upsell in place of the data.
 */
export function InsightsProGate({ username }: Props) {
  return (
    <div className="max-w-lg mx-auto my-10 flex flex-col items-center gap-4 text-center">
      <div className="text-xl md:text-2xl font-bold">
        {i18next.t("profile-insights.pro-gate-title", {
          defaultValue: "Insights is an Ecency Pro feature"
        })}
      </div>
      <p className="opacity-75">
        {i18next.t("profile-insights.pro-gate-body", {
          username,
          defaultValue:
            "Go Pro to explore traffic insights for @{{username}} and any other creator on Ecency."
        })}
      </p>
      <Link href="/perks">
        <Button size="lg">
          {i18next.t("profile-insights.pro-gate-cta", { defaultValue: "Go Pro" })}
        </Button>
      </Link>
    </div>
  );
}
