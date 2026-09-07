import i18next from "i18next";
import type { CurationHandoffEntry, CurationLane } from "@ecency/sdk";
import { DAY_MS } from "./consts";
import { parseChainDate } from "./curation-window";

/**
 * The lane in words, using the labels the refine panel already shows, so the
 * same filter never reads two different ways on one page.
 *
 * Only the facets that narrow are named, most specific first, and only the
 * first two, because the bar is one line per curator and a long lane pushes the
 * position off the end. An empty lane is the whole queue.
 */
export function describeLane(lane: CurationLane | undefined, communityTitle?: string | null): string {
  if (!lane) return "";
  const parts: string[] = [];
  if (lane.community) parts.push(communityTitle || lane.community);
  if (lane.app && lane.app !== "all") parts.push(i18next.t(`curation-desk.filters.app-${lane.app}`));
  if (lane.window && lane.window !== "all") {
    parts.push(i18next.t(`curation-desk.filters.window-${lane.window}`));
  }
  if (lane.new_authors) parts.push(i18next.t("curation-desk.filters.new-authors"));
  if (lane.recommended) parts.push(i18next.t("curation-desk.filters.recommended"));
  if (lane.flagged) parts.push(i18next.t("curation-desk.filters.flagged"));
  // Not hiding handled rows is a lane of its own: that curator is re-reading
  // rather than advancing, so their position says less than it looks like.
  if (lane.hide_reviewed === false) parts.push(i18next.t("curation-desk.handoff.lane-rereading"));
  if (parts.length === 0) return i18next.t("curation-desk.handoff.lane-all");
  if (parts.length > 2) {
    return i18next.t("curation-desk.handoff.lane-more", {
      lane: parts.slice(0, 2).join(", "),
      count: parts.length - 2,
    });
  }
  return parts.join(", ");
}

/**
 * The viewer first, then whoever marked most recently. Their own line is the
 * one they check against, so it should not move down the list as colleagues
 * work.
 */
export function orderHandoff(
  entries: CurationHandoffEntry[] | undefined,
  username: string | undefined
): CurationHandoffEntry[] {
  if (!entries?.length) return [];
  const mine = username ? entries.filter((e) => e.username === username) : [];
  const others = entries.filter((e) => e.username !== username);
  return [...mine, ...others];
}

/**
 * A position from today can print the time alone; anything older has to carry
 * its date, or a curator reads a three day old hand-off as this morning.
 */
export function isSameUtcDay(value: string | null | undefined, now: number): boolean {
  const ms = parseChainDate(value);
  if (ms == null) return false;
  return Math.floor(ms / DAY_MS) === Math.floor(now / DAY_MS);
}
