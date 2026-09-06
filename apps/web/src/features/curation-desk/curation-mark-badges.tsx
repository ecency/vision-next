"use client";

import { memo, useState } from "react";
import i18next from "i18next";
import {
  UilAward,
  UilBell,
  UilCheck,
  UilCommentAltNotes,
  UilExclamationTriangle,
  UilThumbsUp,
} from "@tooni/iconscout-unicons-react";
import { isOnAbuseList, type CurationRecommender } from "@ecency/sdk";
import { dateToRelative } from "@/utils";
import { UserAvatar } from "@/features/shared/user-avatar";
import { Chip } from "./curation-chip";
import { Popover } from "@ui/popover";
import { RecommenderPopover } from "./curation-recommender";
import { formatUtcHm } from "./curation-window";
import type { DeskRow } from "./types";

interface RecommendBadgeProps {
  count: number;
  networks: number;
  noMeta: number;
  recommenders?: CurationRecommender[];
  showCollapse?: boolean;
  /** Lets the popover read route 5 when the caller has no recommender list. */
  author?: string;
  permlink?: string;
}

/**
 * "Recommended by N (M networks)" with up to three stacked avatars, opening a
 * popover of the recommenders and their scorecards. Nothing is requested until
 * the popover opens: a page of rows must not be a page of requests.
 */
export function RecommendBadge({
  count,
  networks,
  noMeta,
  recommenders,
  showCollapse,
  author,
  permlink,
}: RecommendBadgeProps) {
  const [open, setOpen] = useState(false);
  const top = (recommenders ?? [])
    .slice()
    .sort((a, b) => (b.rep ?? 0) - (a.rep ?? 0))
    .slice(0, 3);

  if (count <= 0) return null;

  const canOpen = !!recommenders?.length || (!!author && !!permlink);
  const chip = (
    <Chip tone="blue" title={i18next.t("curation-desk.reco.tooltip")}>
      <UilAward className="size-3.5" aria-hidden />
      {i18next.t("curation-desk.reco.badge", { count, networks })}
      {noMeta > 0 && <span className="opacity-70">{i18next.t("curation-desk.reco.no-meta", { count: noMeta })}</span>}
      {showCollapse && count > networks && (
        <span className="opacity-70">{i18next.t("curation-desk.reco.collapse", { accounts: count, networks })}</span>
      )}
      {top.length > 0 && (
        <span className="flex -space-x-1 ml-0.5">
          {top.map((r) => (
            <UserAvatar key={r.username} username={r.username} size="xsmall" className="size-4 rounded-full ring-1 ring-white dark:ring-dark-200" />
          ))}
        </span>
      )}
    </Chip>
  );

  if (!canOpen) return chip;

  // The panel is the shared portal popover: it floats over the row's and the
  // list's overflow instead of being clipped by them, and flips above the badge
  // near the bottom of the viewport.
  return (
    <Popover
      behavior="click"
      show={open}
      setShow={setOpen}
      placement="bottom-start"
      className="inline-flex"
      // Escape belongs to the popover while it is open, from the focused
      // trigger as much as from inside the panel (portal events bubble to
      // the host); the desk keyboard map would otherwise close the drawer
      // under it.
      onKeyDown={(e) => {
        if (open && e.key === "Escape") {
          e.stopPropagation();
          setOpen(false);
        }
      }}
      customClassName="w-72 max-h-80 overflow-y-auto rounded-xl border border-[--border-color] bg-white dark:bg-dark-200 p-2 shadow-lg text-xs"
      directContent={
        <button
          type="button"
          aria-expanded={open}
          aria-label={i18next.t("curation-desk.reco.who")}
          className="inline-flex rounded-md focus-visible:ring-2 focus-visible:ring-blue-dark-sky outline-none"
          // The popover's click-away listens to the document's mousedown and
          // touchstart and would count the trigger's own press as "away":
          // close, then the click reopens. The trigger is inside the boundary
          // for a mouse and for a finger alike.
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          // The row selects itself on click; opening the popover is not that.
          onClick={(e) => {
            e.stopPropagation();
            setOpen((value) => !value);
          }}
        >
          {chip}
        </button>
      }
    >
      <RecommenderPopover recommenders={recommenders} author={author} permlink={permlink} />
    </Popover>
  );
}

interface Props {
  row: DeskRow;
  isRoster: boolean;
  reviewedByCursor: boolean;
  late: boolean;
  resurfaced: boolean;
  belowCursor: boolean;
  chronological: boolean;
}

/** Markers of spec 8.4 item 8: curated, voted, reviewed, snoozed, flagged, notes, trail facts. */
export const CurationMarkBadges = memo(function CurationMarkBadges({
  row,
  isRoster,
  reviewedByCursor,
  late,
  resurfaced,
  belowCursor,
  chronological,
}: Props) {
  const overlay = row.overlay;
  const trailed = row.trailed_by;
  const teamMark = overlay?.team_mark;
  const reviewedMark = overlay?.marks.find((m) => m.state === "reviewed");
  const snoozeMark = overlay?.marks.find((m) => m.state === "snoozed");
  const flagMark = overlay?.marks.find((m) => m.state === "flagged");
  const payoutValue = row.pending_payout ?? row.pending_payout_est ?? null;
  const payoutEstimated = row.pending_payout == null && row.pending_payout_est != null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {trailed && (
        <Chip tone={trailed.confirmed ? "green" : "amber"} title={i18next.t(`curation-desk.marks.source-${trailed.source === "erobot_push" ? "erobot" : trailed.source === "inferred" ? "inferred" : "history"}`)}>
          <UilThumbsUp className="size-3.5" aria-hidden />
          {trailed.confirmed
            ? i18next.t("curation-desk.marks.curated-by", { curator: trailed.curator, weight: (trailed.weight / 100).toFixed(1), when: dateToRelative(trailed.at) })
            : i18next.t("curation-desk.marks.trail-sent", { curator: trailed.curator })}
        </Chip>
      )}
      {row.voted_by
        .filter((v) => !trailed || v.voter !== trailed.curator)
        .slice(0, 2)
        .map((v) => (
          <Chip key={v.voter} tone="gray" title={i18next.t("curation-desk.marks.not-trailed-why")}>
            <UilThumbsUp className="size-3.5" aria-hidden />
            {i18next.t("curation-desk.marks.voted-by", { voter: v.voter, weight: (v.weight / 100).toFixed(0) })}
          </Chip>
        ))}
      {row.unvoted_at != null && (
        <Chip tone="red">{i18next.t("curation-desk.marks.unvoted")}</Chip>
      )}
      {isRoster && teamMark === "reviewed" && (
        <Chip tone="gray">
          <UilCheck className="size-3.5" aria-hidden />
          {i18next.t("curation-desk.marks.reviewed-by", {
            curator: reviewedMark?.curator ?? overlay?.team_mark_by ?? "",
            when: reviewedMark ? dateToRelative(reviewedMark.updated_at) : "",
          })}
        </Chip>
      )}
      {isRoster && !teamMark && reviewedByCursor && !late && !resurfaced && (
        <Chip tone="gray">
          <UilCheck className="size-3.5" aria-hidden />
          {i18next.t("curation-desk.marks.reviewed-by-cursor")}
        </Chip>
      )}
      {isRoster && teamMark === "snoozed" && (
        <Chip tone="amber">
          <UilBell className="size-3.5" aria-hidden />
          {i18next.t("curation-desk.marks.snoozed-until", {
            curator: snoozeMark?.curator ?? overlay?.team_mark_by ?? "",
            until: formatUtcHm(snoozeMark?.snooze_until),
          })}
        </Chip>
      )}
      {isRoster && teamMark === "flagged" && (
        <Chip tone="red">
          <UilExclamationTriangle className="size-3.5" aria-hidden />
          {flagMark?.reason
            ? i18next.t(`curation-desk.flag-reasons.${flagMark.reason}`, { defaultValue: flagMark.reason })
            : i18next.t("curation-desk.marks.flagged")}
          {flagMark?.curator ? ` · @${flagMark.curator}` : ""}
        </Chip>
      )}
      {isRoster && isOnAbuseList(overlay?.flags) && <Chip tone="red">{i18next.t("curation-desk.marks.abuse-list")}</Chip>}
      {isRoster && overlay?.excluded_reason && (
        <Chip tone="red" title={i18next.t("curation-desk.marks.excluded-tooltip")}>
          {i18next.t(`curation-desk.excluded-reasons.${overlay.excluded_reason}`, {
            defaultValue: i18next.t("curation-desk.marks.excluded", { reason: overlay.excluded_reason }),
          })}
        </Chip>
      )}
      {row.is_gray && <Chip tone="gray">{i18next.t("curation-desk.marks.grayed")}</Chip>}
      {isRoster && (overlay?.notes_count ?? 0) > 0 && (
        <Chip tone="gray">
          <UilCommentAltNotes className="size-3.5" aria-hidden />
          {overlay?.notes_count}
        </Chip>
      )}
      {late && <Chip tone="amber">{i18next.t("curation-desk.marks.late")}</Chip>}
      {resurfaced && <Chip tone="amber">{i18next.t("curation-desk.marks.snooze-ended")}</Chip>}
      {belowCursor && !chronological && <Chip tone="gray">{i18next.t("curation-desk.marks.below-cursor")}</Chip>}
      {row.author_trailed_at && (
        <Chip tone="gray" title={i18next.t("curation-desk.marks.author-trailed-tooltip")}>
          {i18next.t("curation-desk.marks.author-trailed", { when: dateToRelative(row.author_trailed_at) })}
        </Chip>
      )}
      {payoutValue != null && (
        <Chip tone="gray">
          {i18next.t("curation-desk.marks.payout", {
            amount: payoutValue.toFixed(2),
            votes: row.votes ?? 0,
          })}
          {payoutEstimated ? ` ${i18next.t("curation-desk.marks.estimated")}` : ""}
        </Chip>
      )}
      {row.is_declined && <Chip tone="gray">{i18next.t("curation-desk.marks.declined")}</Chip>}
      <RecommendBadge
        count={row.recommend_count}
        networks={row.unique_recommenders}
        noMeta={row.reco_no_meta_count}
        showCollapse={isRoster}
        author={row.author}
        permlink={row.permlink}
      />
    </div>
  );
});
