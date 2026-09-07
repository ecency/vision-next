"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import i18next from "i18next";
import { UilTimes } from "@tooni/iconscout-unicons-react";
import type { CurationMarkState } from "@ecency/sdk";
import { Button } from "@ui/button";
import { LoginRequired } from "@/features/shared/login-required";
import { error as errorToast } from "@/features/shared/feedback";
import { formatError } from "@/api/format-error";
import { dateToRelative } from "@/utils";
import { Chip } from "./curation-chip";
import { formatUtcDateHm } from "./curation-window";
import { useClearMark, useMyMarks, useViewerRole } from "./hooks";

/**
 * "All" first, then the four states. A mark is written by the review actions
 * only: a vote is not a mark, so a post the curator curated is never in this
 * list. Opening on a single state hid every other one behind a pill that
 * carried no count, which read as "my marks are not showing".
 */
type MarksTab = "all" | CurationMarkState;
const TABS: MarksTab[] = ["all", "reviewed", "snoozed", "flagged", "noted"];

function MarksList({ tab }: { tab: MarksTab }) {
  const state = tab === "all" ? undefined : tab;
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useMyMarks(state);
  const clearMark = useClearMark();
  // Keyset pages, appended: the route hands back a cursor while more remain.
  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  if (isLoading) return <p className="p-4 text-sm text-gray-500">{i18next.t("curation-desk.list.loading")}</p>;
  // A failed later page leaves the loaded ones in the cache and raises isError,
  // so the full-page error is only right while nothing is on screen.
  if (isError && items.length === 0)
    return <p className="p-4 text-sm text-red-030 dark:text-red-light-020" role="alert">{i18next.t("curation-desk.list.error")}</p>;
  // Naming the tab matters: the generic sentence under a state pill reads as
  // "the desk lost my marks" rather than "this state has none".
  if (!items.length)
    return (
      <p className="p-6 text-sm text-gray-500 text-center">
        {tab === "all"
          ? i18next.t("curation-desk.marks-view.empty")
          : i18next.t("curation-desk.marks-view.empty-state", {
              state: i18next.t(`curation-desk.mark-states.${tab}`).toLowerCase()
            })}
      </p>
    );

  return (
    <>
      <ul className="divide-y divide-[--border-color]">
        {items.map((mark) => (
          <li key={`${mark.author}/${mark.permlink}`} className="flex items-start gap-3 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <a href={`/@${mark.author}/${mark.permlink}`} className="font-semibold hover:underline line-clamp-1">
                {mark.title || i18next.t("curation-desk.row.untitled", { author: mark.author })}
              </a>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                <span>@{mark.author}</span>
                <span>{dateToRelative(mark.updated_at)}</span>
                {/* The All tab mixes states, so each row names its own. */}
                {tab === "all" && (
                  <Chip tone="gray">{i18next.t(`curation-desk.mark-states.${mark.state}`)}</Chip>
                )}
                {mark.state === "snoozed" && mark.snooze_until && (
                  <Chip tone="amber">{i18next.t("curation-desk.marks-view.until", { until: formatUtcDateHm(mark.snooze_until) })}</Chip>
                )}
                {mark.reason && <Chip tone="red">{i18next.t(`curation-desk.flag-reasons.${mark.reason}`, { defaultValue: mark.reason })}</Chip>}
              </div>
              {mark.note && <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{mark.note}</p>}
            </div>
            <Button
              size="xs"
              appearance="gray-link"
              className="!rounded-lg"
              aria-label={i18next.t("curation-desk.actions.clear-mark")}
              disabled={clearMark.isPending}
              onClick={async () => {
                try {
                  await clearMark.mutateAsync({ author: mark.author, permlink: mark.permlink });
                } catch (e) {
                  errorToast(...formatError(e));
                }
              }}
              icon={<UilTimes />}
            />
          </li>
        ))}
      </ul>
      {/* The loaded records stay; the page that failed is reported under them. */}
      {isError && (
        <p className="px-3 py-2 text-xs text-red-030 dark:text-red-light-020" role="alert">
          {i18next.t("curation-desk.list.error")}
        </p>
      )}
      {hasNextPage && (
        <div className="flex justify-center p-3">
          <Button
            size="sm"
            appearance="secondary"
            disabled={isFetchingNextPage}
            isLoading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? i18next.t("g.loading") : i18next.t("g.load-more")}
          </Button>
        </div>
      )}
    </>
  );
}

/** My marks: everything, then one tab per state. Roster only. */
export function CurationMyMarksView() {
  const viewer = useViewerRole();
  const [tab, setTab] = useState<MarksTab>("all");

  return (
    <div className="bg-white dark:bg-dark-200 rounded-2xl overflow-hidden">
      <LoginRequired>
        {viewer.isLoading ? (
          <p className="p-4 text-sm text-gray-500">{i18next.t("curation-desk.list.loading")}</p>
        ) : !viewer.isRoster ? (
          <p className="p-6 text-sm text-gray-500 text-center">{i18next.t("curation-desk.marks-view.roster-only")}</p>
        ) : (
          <>
            <div role="tablist" aria-label={i18next.t("curation-desk.marks-view.title")} className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-[--border-color]">
              {TABS.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  className={clsx(
                    "shrink-0 rounded-full px-3 py-1 text-xs",
                    tab === value ? "bg-blue-dark-sky text-white" : "bg-gray-100 dark:bg-dark-default text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => setTab(value)}
                >
                  {value === "all"
                    ? i18next.t("curation-desk.marks-view.all")
                    : i18next.t(`curation-desk.mark-states.${value}`)}
                </button>
              ))}
            </div>
            <p className="px-3 pt-2 text-xs text-gray-500">
              {i18next.t("curation-desk.marks-view.votes-hint")}
            </p>
            <MarksList tab={tab} />
          </>
        )}
      </LoginRequired>
    </div>
  );
}
