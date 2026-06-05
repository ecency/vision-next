"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import i18next from "i18next";
import { useQuery } from "@tanstack/react-query";
import { getSpotlightsQueryOptions } from "@ecency/sdk";
import { Button } from "@ui/button";
import { closeSvg } from "@ui/svg";
import * as ls from "@/utils/local-storage";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { pickSpotlight } from "./select";

const DISMISS_KEY = "dismiss_spotlights";

export function FeatureSpotlightWidget() {
  const { activeUser } = useActiveAccount();
  const pathname = usePathname();

  const { data } = useQuery(getSpotlightsQueryOptions());

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => ls.get(DISMISS_KEY) ?? []);

  const spotlight = useMemo(
    () => pickSpotlight(data ?? [], activeUser, pathname, dismissedIds, "web"),
    [data, activeUser, pathname, dismissedIds]
  );

  if (!spotlight) {
    return null;
  }

  const dismiss = () => {
    const current: string[] = ls.get(DISMISS_KEY) ?? [];
    if (!current.includes(spotlight.id)) {
      ls.set(DISMISS_KEY, [...current, spotlight.id]);
    }
    setDismissedIds((prev) => (prev.includes(spotlight.id) ? prev : [...prev, spotlight.id]));
  };

  const copy = spotlight.locales?.[i18next.language] ?? spotlight;
  const isExternal = /^https?:\/\//.test(spotlight.button_link);

  return (
    <div className="feature-spotlight relative mb-4 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
      <Button
        appearance="link"
        className="absolute top-2 right-2"
        onClick={dismiss}
        aria-label={i18next.t("feature-spotlight.dismiss")}
      >
        {closeSvg}
      </Button>
      <div className="text-xs font-semibold uppercase tracking-wide text-blue-dark-sky">
        {i18next.t("feature-spotlight.label")}
      </div>
      <div className="mt-1 font-semibold">{copy.title}</div>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{copy.description}</p>
      <div className="mt-3">
        {isExternal ? (
          <a
            href={spotlight.button_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
          >
            <Button size="sm" appearance="primary">
              {copy.button_text}
            </Button>
          </a>
        ) : (
          <Link href={spotlight.button_link} onClick={dismiss}>
            <Button size="sm" appearance="primary">
              {copy.button_text}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
