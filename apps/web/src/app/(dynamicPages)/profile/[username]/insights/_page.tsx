"use client";

import { useMemo, useState } from "react";
import i18next from "i18next";
import Link from "next/link";
import defaults from "@/defaults";
import { EcencyConfigManager } from "@/config";
import { getPageStatsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { Spinner, Table, Td, Th, Tr } from "@/features/ui";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@/features/ui/dropdown";

interface Props {
  username: string;
}

interface InsightsRangeProps {
  username: string;
  dateRange: string;
  label: string;
}

interface InsightsRow {
  page: string;
  href: string;
  views: number;
  uniques: number;
  minutes: number;
}

function InsightsRange({ username, dateRange, label }: InsightsRangeProps) {
  const statsQuery = useQuery(
    getPageStatsQueryOptions(
      `/@${username}/`,
      ["event:page"],
      ["pageviews", "visitors", "visit_duration"],
      dateRange ? [dateRange] : undefined
    )
  );

  const formatter = useMemo(() => new Intl.NumberFormat(), []);

  const rows = useMemo<InsightsRow[]>(() => {
    const pages = statsQuery.data?.results ?? [];

    return pages
      .map((page) => {
        const pagePath = page.dimensions?.[0] ?? "";
        const normalizedPath = pagePath.replace(defaults.base, "");
        const href = pagePath.startsWith("http")
          ? pagePath
          : `${defaults.base}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
        const displayPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
        const [views = 0, uniques = 0, duration = 0] = page.metrics ?? [];

        return {
          page: displayPath,
          href,
          views,
          uniques,
          minutes: duration / 60
        } as InsightsRow;
      })
      .sort((a, b) => b.views - a.views);
  }, [statsQuery.data]);

  return (
    <div className="glass-box rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-lg">{label}</div>
        {statsQuery.isLoading && <Spinner className="w-5 h-5" />}
      </div>

      {statsQuery.isError && (
        <div className="text-sm text-red-500 dark:text-red-300">
          {i18next.t("profile-insights.error", { defaultValue: "Unable to load insights." })}
        </div>
      )}

      {!statsQuery.isLoading && rows.length === 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {i18next.t("profile-insights.no-data", {
            defaultValue: "No page views available for this range yet."
          })}
        </div>
      )}

      {rows.length > 0 && (
        <Table full>
          <thead>
            <Tr>
              <Th>{i18next.t("profile-insights.page", { defaultValue: "Page" })}</Th>
              <Th className="text-right">
                {i18next.t("profile-insights.views", { defaultValue: "Views" })}
              </Th>
              <Th className="text-right">
                {i18next.t("profile-insights.uniques", { defaultValue: "Unique views" })}
              </Th>
              <Th className="text-right">
                {i18next.t("profile-insights.minutes", { defaultValue: "Minutes" })}
              </Th>
            </Tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={`${dateRange}-${row.href}`}>
                <Td>
                  <Link href={row.href} target="_blank" className="text-blue-dark-sky hover:underline">
                    {row.page}
                  </Link>
                </Td>
                <Td className="text-right">{formatter.format(row.views)}</Td>
                <Td className="text-right">{formatter.format(row.uniques)}</Td>
                <Td className="text-right">{row.minutes.toFixed(1)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export function ProfileInsights({ username }: Props) {
  const isEnabled = EcencyConfigManager.getConfigValue(
    ({ visionFeatures }) => visionFeatures.plausible.enabled
  );

  const ranges = useMemo(
    () => [
      {
        dateRange: "day",
        label: i18next.t("profile-insights.today", { defaultValue: "Today" })
      },
      {
        dateRange: "7d",
        label: i18next.t("profile-insights.last-7", { defaultValue: "Last 7 days" })
      },
      {
        dateRange: "30d",
        label: i18next.t("profile-insights.last-30", { defaultValue: "Last 30 days" })
      },
      {
        dateRange: "all",
        label: i18next.t("profile-insights.all-time", { defaultValue: "All time" })
      }
    ],
    []
  );

  const [selectedRange, setSelectedRange] = useState(
    ranges.find((range) => range.dateRange === "7d") ?? ranges[0]
  );

  if (!isEnabled) {
    return (
      <div className="glass-box rounded-xl p-4">
        {i18next.t("profile-insights.disabled", {
          defaultValue: "Insights are disabled at the moment."
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-box rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xl font-semibold">
              {i18next.t("profile.section-insights", { defaultValue: "Insights" })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {i18next.t("profile-insights.description", {
                defaultValue: "See which of your posts resonate most with readers."
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {i18next.t("profile-insights.range", { defaultValue: "Date range" })}
            </div>
            <Dropdown>
              <DropdownToggle
                withChevron
                className="text-sm font-semibold px-3 py-2 border rounded-xl border-[--border-color] bg-white dark:bg-gray-900"
              >
                {selectedRange.label}
              </DropdownToggle>
              <DropdownMenu align="right" size="small">
                {ranges.map((range) => (
                  <DropdownItem
                    key={range.dateRange}
                    selected={range.dateRange === selectedRange.dateRange}
                    onClick={() => setSelectedRange(range)}
                  >
                    {range.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      <InsightsRange
        username={username}
        {...selectedRange}
      />
    </div>
  );
}

