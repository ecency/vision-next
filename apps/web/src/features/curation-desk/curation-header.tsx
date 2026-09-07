"use client";

import { memo, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import i18next from "i18next";
import { useQuery } from "@tanstack/react-query";
import { UilAngleDown, UilKeyboard, UilPauseCircle } from "@tooni/iconscout-unicons-react";
import {
  getAccountFullQueryOptions,
  getDynamicPropsQueryOptions,
  powerRechargeTime,
  votingPower,
  votingValue,
  type CurationActiveCurator,
  type CurationStatus,
} from "@ecency/sdk";
import { Button } from "@ui/button";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { UserAvatar } from "@/features/shared/user-avatar";

interface Props {
  status: CurationStatus | undefined;
  activeCurators: CurationActiveCurator[];
  isRoster: boolean;
  livePaused: boolean;
  onHelp: () => void;
}

const TRAIL_ACCOUNT = "ecency";

function budgetTone(vpPercent: number | undefined): "green" | "amber" | "red" | "gray" {
  if (vpPercent == null) return "gray";
  if (vpPercent >= 75) return "green";
  if (vpPercent >= 65) return "amber";
  return "red";
}

function Tile({
  label,
  value,
  title,
  tone,
  children
}: {
  label: string;
  value: React.ReactNode;
  title?: string;
  tone?: "green" | "amber" | "red" | "gray";
  children?: React.ReactNode;
}) {
  return (
    <div
      title={title}
      className={clsx(
        "flex min-w-0 flex-col gap-1 rounded-lg bg-gray-100 dark:bg-dark-default px-3 py-3",
        tone === "amber" && "text-warning-ink dark:text-warning-default",
        tone === "red" && "text-red-030 dark:text-red-light-020"
      )}
    >
      <span className="text-[10px] uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm font-semibold leading-tight">{value}</span>
      {children}
    </div>
  );
}

/**
 * Header widgets of spec 9.3. Every number comes from data the page already
 * has: `status` (worker-written VP, implied weight, mana budget), the viewer's
 * own account and two cached public RPC queries for the vote value estimate.
 * The header never says "vote value falls with VP": it says the trail weight
 * falls with @ecency VP, which is the bot's rule.
 */
export const CurationHeader = memo(function CurationHeader({
  status: liveStatus,
  activeCurators,
  isRoster,
  livePaused,
  onHelp
}: Props) {
  // The tabs can populate the shared status cache before this streamed page
  // hydrates. Match the empty server shell until this header has mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const status = mounted ? liveStatus : undefined;
  const { account } = useActiveAccount();
  const vp = status?.vp;
  const mana = status?.mana_spent_today;

  const ecency = useQuery({ ...getAccountFullQueryOptions(TRAIL_ACCOUNT), staleTime: 60_000 });
  const props = useQuery({ ...getDynamicPropsQueryOptions(), staleTime: 60_000 });

  const impliedWeight = vp?.implied_weight ?? null;
  const trailValue = useMemo(() => {
    if (!ecency.data || !props.data || impliedWeight == null) return null;
    try {
      return votingValue(ecency.data, props.data, votingPower(ecency.data) * 100, impliedWeight);
    } catch {
      return null;
    }
  }, [ecency.data, props.data, impliedWeight]);

  const ownVp = useMemo(() => {
    if (!account) return null;
    try {
      return votingPower(account);
    } catch {
      return null;
    }
  }, [account]);
  const ownValue = useMemo(() => {
    if (!account || !props.data || ownVp == null) return null;
    try {
      return votingValue(account, props.data, ownVp * 100, 10000);
    } catch {
      return null;
    }
  }, [account, props.data, ownVp]);

  const rechargeHours = useMemo(() => {
    if (vp?.live_percent == null) return null;
    try {
      return powerRechargeTime(Math.min(100, Math.max(0, vp.live_percent))) / 3600;
    } catch {
      return null;
    }
  }, [vp?.live_percent]);

  const sustainable = vp?.sustainable_votes_per_day ?? null;
  const spent = mana?.equiv ?? null;
  const gap = mana?.crosscheck != null && spent != null ? Math.abs(mana.crosscheck - spent) : null;
  const tone = budgetTone(vp?.percent);
  const barPct =
    sustainable && spent != null ? Math.min(100, Math.round((spent / sustainable) * 100)) : 0;

  return (
    <header
      className="relative px-4 py-3 sm:px-5 text-xs"
      aria-label={i18next.t("curation-desk.header.aria")}
    >
      <details className="group/overview">
        <summary className="mr-10 flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-2 rounded-md py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-dark-sky [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            {i18next.t("curation-desk.header.overview")}
            <UilAngleDown
              className="size-4 text-gray-500 transition-transform group-open/overview:rotate-180"
              aria-hidden
            />
          </span>
          {status?.counts && (
            <span className="text-gray-600 dark:text-gray-400">
              {i18next.t("curation-desk.header.curated-summary", {
                count: status.counts.curated_24h
              })}
            </span>
          )}
          {vp && (
            <span
              className={clsx(
                "inline-flex items-center gap-2",
                tone === "red"
                  ? "text-red-030 dark:text-red-light-020"
                  : tone === "amber"
                    ? "text-warning-ink dark:text-warning-default"
                    : "text-gray-600 dark:text-gray-400"
              )}
            >
              <span
                className={clsx(
                  "size-1.5 rounded-full",
                  tone === "green"
                    ? "bg-green"
                    : tone === "amber"
                      ? "bg-warning-default"
                      : "bg-red"
                )}
                aria-hidden
              />
              {i18next.t("curation-desk.header.power-summary", { vp: vp.percent.toFixed(1) })}
            </span>
          )}
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
          {status?.counts && (
            <Tile
              label={i18next.t("curation-desk.header.curated-today")}
              value={status.counts.curated_24h}
              title={i18next.t("curation-desk.header.curated-today-tooltip", {
                posts: status.counts.trail_votes_today?.posts ?? 0,
                comments: status.counts.trail_votes_today?.comments ?? 0
              })}
            >
              <span className="text-[11px] text-gray-500">
                {i18next.t("curation-desk.header.trail-votes", {
                  posts: status.counts.trail_votes_today?.posts ?? 0,
                  comments: status.counts.trail_votes_today?.comments ?? 0
                })}
              </span>
            </Tile>
          )}

          {isRoster && (
            <Tile
              label={i18next.t("curation-desk.header.active")}
              value={
                activeCurators.length ? (
                  <span className="flex -space-x-1">
                    {activeCurators.slice(0, 6).map((c) => (
                      <UserAvatar
                        key={c.username}
                        username={c.username}
                        size="xsmall"
                        className="size-5 rounded-full ring-1 ring-white dark:ring-dark-200"
                      />
                    ))}
                  </span>
                ) : (
                  i18next.t("curation-desk.header.active-none")
                )
              }
              title={activeCurators.map((c) => `@${c.username}`).join(", ")}
            >
              {activeCurators.length > 0 && (
                <span className="text-[11px] text-gray-500">
                  {i18next.t("curation-desk.header.active-hint")}
                </span>
              )}
            </Tile>
          )}

          {ownVp != null && (
            <Tile
              label={i18next.t("curation-desk.header.your-vp")}
              value={`${ownVp.toFixed(1)}%`}
              title={
                ownValue != null
                  ? i18next.t("curation-desk.header.your-value", { value: ownValue.toFixed(3) })
                  : undefined
              }
            >
              {ownValue != null && (
                <span className="text-[11px] text-gray-500">
                  {i18next.t("curation-desk.header.your-value", { value: ownValue.toFixed(3) })}
                </span>
              )}
            </Tile>
          )}

          <Tile
            label={i18next.t("curation-desk.header.ecency-vp")}
            tone={tone}
            value={
              vp
                ? i18next.t("curation-desk.header.ecency-vp-value", {
                    vp: vp.percent.toFixed(1),
                    weight: (vp.implied_weight / 100).toFixed(1)
                  })
                : i18next.t("curation-desk.header.unknown")
            }
            title={[
              i18next.t("curation-desk.header.ecency-vp-tooltip"),
              vp?.live_percent != null
                ? i18next.t("curation-desk.header.live-vp", { vp: vp.live_percent.toFixed(1) })
                : "",
              rechargeHours != null
                ? i18next.t("curation-desk.header.recharge", { hours: rechargeHours.toFixed(1) })
                : ""
            ]
              .filter(Boolean)
              .join("\n")}
          >
            {trailValue != null && (
              <span className="text-[11px] text-gray-500">
                {i18next.t("curation-desk.header.trail-value", { value: trailValue.toFixed(2) })}
              </span>
            )}
          </Tile>

          <Tile
            label={i18next.t("curation-desk.header.mana")}
            tone={tone}
            value={
              spent != null && sustainable
                ? i18next.t("curation-desk.header.mana-value", {
                    spent: Math.round(spent),
                    max: sustainable
                  })
                : i18next.t("curation-desk.header.unknown")
            }
            title={[
              mana
                ? i18next.t("curation-desk.header.mana-split", {
                    trail: Math.round(mana.trail),
                    other: Math.round(mana.other)
                  })
                : "",
              vp?.regen_votes_per_hour != null
                ? i18next.t("curation-desk.header.regen", {
                    rate: vp.regen_votes_per_hour.toFixed(1)
                  })
                : "",
              mana?.crosscheck != null
                ? i18next.t("curation-desk.header.crosscheck", {
                    value: Math.round(mana.crosscheck)
                  })
                : "",
              gap != null && gap > 2 ? i18next.t("curation-desk.header.crosscheck-gap") : ""
            ]
              .filter(Boolean)
              .join("\n")}
          >
            <div
              className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-dark-default overflow-hidden"
              aria-hidden
            >
              <div
                className={clsx(
                  "h-full rounded-full",
                  tone === "green" && "bg-green",
                  tone === "amber" && "bg-warning-default",
                  tone === "red" && "bg-red",
                  tone === "gray" && "bg-gray-400"
                )}
                style={{ width: `${barPct}%` }}
              />
            </div>
            {mana && (
              <span className="text-[11px] text-gray-500">
                {i18next.t("curation-desk.header.mana-split", {
                  trail: Math.round(mana.trail),
                  other: Math.round(mana.other)
                })}
                {vp?.regen_votes_per_hour != null
                  ? ` · ${i18next.t("curation-desk.header.regen", { rate: vp.regen_votes_per_hour.toFixed(1) })}`
                  : ""}
              </span>
            )}
          </Tile>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500">
          {status?.head_lag_seconds != null && (
            <span title={i18next.t("curation-desk.header.lag-tooltip")}>
              {i18next.t("curation-desk.header.lag", { seconds: status.head_lag_seconds })}
            </span>
          )}
          {status?.reco_lag_blocks != null && status.reco_lag_blocks > 0 && (
            <span title={i18next.t("curation-desk.header.reco-lag-tooltip")}>
              {i18next.t("curation-desk.header.reco-lag", { blocks: status.reco_lag_blocks })}
            </span>
          )}
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500">
        {status?.worker_tick_age_seconds != null && status.worker_tick_age_seconds > 120 && (
          <span className="mt-2 text-warning-ink dark:text-warning-default">
            {i18next.t("curation-desk.header.worker-stale")}
          </span>
        )}
        {livePaused && (
          <span
            className="mt-2 inline-flex items-center gap-1 text-warning-ink dark:text-warning-default"
            role="status"
          >
            <UilPauseCircle className="size-4" aria-hidden />
            {i18next.t("curation-desk.header.live-paused")}
          </span>
        )}
        <Button
          size="xs"
          appearance="gray-link"
          className="!rounded-lg absolute right-4 top-3 sm:right-5"
          aria-label={i18next.t("curation-desk.shortcuts.title")}
          title={i18next.t("curation-desk.shortcuts.title")}
          onClick={onHelp}
          icon={<UilKeyboard />}
        />
      </div>
    </header>
  );
});
