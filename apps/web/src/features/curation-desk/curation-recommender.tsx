"use client";

import { memo } from "react";
import i18next from "i18next";
import { useQuery } from "@tanstack/react-query";
import { UilAward, UilShieldCheck } from "@tooni/iconscout-unicons-react";
import {
  getCurationPostQueryOptions,
  getCurationRecommenderQueryOptions,
  type CurationRecommender,
} from "@ecency/sdk";
import { UserAvatar } from "@/features/shared/user-avatar";
import { dateToRelative } from "@/utils";
import { Chip } from "./curation-chip";
import { POPOVER_RECOMMENDER_LIMIT } from "./consts";

/** Trims the trailing zero a numeric(4,2) brings, so 1.30 reads as 1.3. */
export function formatPrecision(precision: number): string {
  return String(Math.round(precision * 100) / 100);
}

/**
 * Status for good judgment: at least ten recommendations with a weight of
 * x1.2 or better. It reads `trusted` off the recommender entry the list
 * already carries, so a row costs no request.
 */
export const RecommenderChip = memo(function RecommenderChip({
  trusted,
}: {
  trusted?: boolean | null;
}) {
  if (!trusted) return null;
  return (
    <Chip tone="green" title={i18next.t("curation-desk.scorecard.trusted-tooltip")}>
      <UilShieldCheck className="size-3.5" aria-hidden />
      {i18next.t("curation-desk.scorecard.trusted")}
    </Chip>
  );
});

interface ScorecardProps {
  username: string | undefined;
  /** The viewer's own record, which gets the incentive sentence with it. */
  own?: boolean;
}

/**
 * One recommender's 90-day record (route 14). The query runs on mount, so
 * this component is rendered by an opened popover or an opened dialog and
 * never by a feed row: 25 rows on screen must not mean 25 requests.
 */
export function RecommenderScorecard({ username, own }: ScorecardProps) {
  const options = getCurationRecommenderQueryOptions(username ?? "");
  const { data, isLoading, isError } = useQuery(options);

  if (!username) return null;
  if (isLoading) {
    return <p className="text-gray-500">{i18next.t("curation-desk.scorecard.loading")}</p>;
  }
  if (isError || !data) {
    return <p className="text-gray-500">{i18next.t("curation-desk.scorecard.unavailable")}</p>;
  }

  return (
    <div className="flex flex-col gap-0.5 text-[11px] leading-4">
      <span className="text-gray-500">
        {own
          ? i18next.t("curation-desk.scorecard.yours", { days: data.window_days })
          : i18next.t("curation-desk.scorecard.window", { days: data.window_days })}
      </span>
      <span className="text-gray-600 dark:text-gray-400">
        {i18next.t("curation-desk.scorecard.line", {
          recommended: data.recommended,
          curated: data.curated,
          dismissed: data.dismissed,
          withdrawn: data.withdrawn,
        })}
      </span>
      <span className="flex items-center gap-1">
        <Chip
          tone={data.precision > 1 ? "green" : data.precision < 1 ? "amber" : "gray"}
          title={i18next.t("curation-desk.scorecard.weight-tooltip")}
        >
          {i18next.t("curation-desk.scorecard.weight", { precision: formatPrecision(data.precision) })}
        </Chip>
        {/* In a popover the name above already carries the chip; only the
            viewer's own card has no line of its own to carry it. */}
        {own && <RecommenderChip trusted={data.trusted} />}
      </span>
      {own && (
        <span className="text-gray-500">{i18next.t("curation-desk.scorecard.incentive")}</span>
      )}
    </div>
  );
}

interface PopoverProps {
  /** Already loaded recommenders; route 5 is read only when this is absent. */
  recommenders?: CurationRecommender[];
  author?: string;
  permlink?: string;
}

/**
 * The badge popover's content: who recommended the post, why, when and how
 * each of them has done before. Route 5 and every scorecard load on open,
 * never on render, with the list capped so one open costs a bounded number of
 * requests. Positioning, click-away and Escape belong to the badge, which
 * hosts this inside the shared portal popover.
 */
export function RecommenderPopover({ recommenders, author, permlink }: PopoverProps) {
  const needsFetch = !recommenders && !!author && !!permlink;
  const postOptions = getCurationPostQueryOptions(author ?? "", permlink ?? "");
  const { data: post, isLoading } = useQuery({
    ...postOptions,
    enabled: needsFetch && postOptions.enabled,
  });
  const list = recommenders ?? post?.recommenders ?? [];
  const shown = list.slice(0, POPOVER_RECOMMENDER_LIMIT);

  return (
    <div role="group" aria-label={i18next.t("curation-desk.reco.who")}>
      {needsFetch && isLoading && (
        <p className="text-gray-500">{i18next.t("curation-desk.scorecard.loading")}</p>
      )}
      {shown.length === 0 && !isLoading && (
        <p className="text-gray-500">{i18next.t("curation-desk.quick-view.no-recommenders")}</p>
      )}
      <ul className="flex flex-col gap-2">
        {shown.map((r) => (
          <li key={r.username} className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-1">
              <UserAvatar username={r.username} size="xsmall" className="size-4 rounded-full" />
              <span className="font-semibold">@{r.username}</span>
              {r.rep != null && <span className="text-gray-500">({r.rep})</span>}
              {r.reason && <Chip tone="blue">{i18next.t(`curation-desk.reasons.${r.reason}`)}</Chip>}
              {r.is_self && <Chip tone="gray">{i18next.t("curation-desk.reco.author")}</Chip>}
              <RecommenderChip trusted={r.trusted} />
              <span className="text-gray-500 ml-auto">{dateToRelative(r.at)}</span>
            </span>
            <RecommenderScorecard username={r.username} />
          </li>
        ))}
      </ul>
      {list.length > shown.length && (
        <p className="text-gray-500 mt-1">
          {i18next.t("curation-desk.reco.more", { n: list.length - shown.length })}
        </p>
      )}
      <p className="text-gray-500 mt-2 flex items-start gap-1">
        <UilAward className="size-3.5 shrink-0" aria-hidden />
        {i18next.t("curation-desk.scorecard.explainer")}
      </p>
    </div>
  );
}
