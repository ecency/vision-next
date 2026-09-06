"use client";

import clsx from "clsx";
import i18next from "i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCurationStatusQueryOptions } from "@ecency/sdk";
import { EcencyConfigManager } from "@/config";

const TABS = [
  { href: "/curation", key: "queue" },
  { href: "/curation/marks", key: "marks" },
  { href: "/curation/recommendations", key: "recommendations" },
  { href: "/curation/guide", key: "guide" }
] as const;

/** Queue / Marks / Recommendations / Guide, with counts from the status query. */
export function CurationTabs() {
  const pathname = usePathname() ?? "/curation";
  const onGuide = pathname.startsWith("/curation/guide");
  const { data: status } = useQuery({ ...getCurationStatusQueryOptions(), enabled: !onGuide });
  // The recommendations route answers notFound while the sub-flag is off, so
  // the tab that points at it goes with it.
  const recommendationsEnabled = EcencyConfigManager.useConfig(
    ({ visionFeatures }) => visionFeatures.curationDesk.recommendations.enabled
  );
  const tabs = recommendationsEnabled ? TABS : TABS.filter((tab) => tab.key !== "recommendations");

  const counts: Record<string, number | undefined> = {
    queue: status?.counts?.unreviewed,
    recommendations: status?.counts?.recommended_posts
  };

  return (
    <div className="px-2">
      <h1 className="text-2xl font-bold tracking-tight">{i18next.t("curation-desk.page-title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {i18next.t("curation-desk.page-intro")}
      </p>
      <nav
        aria-label={i18next.t("curation-desk.tabs.aria")}
        className="mt-5 flex items-center gap-5 overflow-x-auto border-b border-[--border-color] text-sm"
      >
        {tabs.map((tab) => {
          const active =
            tab.href === "/curation" ? pathname === "/curation" : pathname.startsWith(tab.href);
          const count = counts[tab.key];
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 pt-1 font-medium transition-colors focus-visible:outline-blue-dark-sky",
                active
                  ? "border-blue-dark-sky text-blue-dark-sky"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-blue-dark-sky"
              )}
            >
              {i18next.t(`curation-desk.tabs.${tab.key}`)}
              {count != null && count > 0 && (
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-[11px] tabular-nums",
                    active ? "bg-blue-dark-sky/10" : "bg-gray-100 dark:bg-dark-default"
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
