import { describe, expect, it } from "vitest";
import { makeOverlay, makeRow } from "./curation-test-utils";
import { rowHiddenByFeed } from "@/features/curation-desk/curation-feed-rules";

const open = (mark: "reviewed" | "snoozed" | "flagged" | null = null, extra: Partial<ReturnType<typeof makeOverlay>> = {}) =>
  makeRow({ post_id: 1, state: 0, overlay: makeOverlay({ team_mark: mark, team_mark_by: mark ? "riyat" : null, ...extra }) });

describe("rowHiddenByFeed", () => {
  it("mirrors the roster feed's defaults: reviewed and snoozed rows leave, noted and flagged rows stay", () => {
    expect(rowHiddenByFeed(open(), {})).toBe(false);
    expect(rowHiddenByFeed(open("reviewed"), {})).toBe(true);
    expect(rowHiddenByFeed(open("snoozed"), {})).toBe(true);
    expect(rowHiddenByFeed(open("flagged"), {})).toBe(false);
    // A note never becomes a team mark, so a noted row reads as unmarked here.
    expect(rowHiddenByFeed(open(null, { notes_count: 2 }), {})).toBe(false);
  });

  it("reads the filters off either the request (booleans) or the query key (strings)", () => {
    expect(rowHiddenByFeed(open("reviewed"), { hide_reviewed: false })).toBe(false);
    expect(rowHiddenByFeed(open("reviewed"), { hide_reviewed: "0" })).toBe(false);
    expect(rowHiddenByFeed(open("snoozed"), { hide_snoozed: "0" })).toBe(false);
    expect(rowHiddenByFeed(open("snoozed"), { hide_reviewed: "0" })).toBe(true);
  });

  it("keeps curated rows out unless the feed shows them", () => {
    const curated = makeRow({ post_id: 2, state: 1, overlay: makeOverlay() });
    expect(rowHiddenByFeed(curated, {})).toBe(true);
    expect(rowHiddenByFeed(curated, { hide_curated: false })).toBe(false);
    expect(rowHiddenByFeed(curated, { hide_curated: "0" })).toBe(false);
    // The recommended lens and the unique order pin open rows whatever the toggle says.
    expect(rowHiddenByFeed(curated, { hide_curated: false, recommended: true })).toBe(true);
    expect(rowHiddenByFeed(curated, { hide_curated: false, sort: "unique" })).toBe(true);
    expect(rowHiddenByFeed(curated, { view: "all" })).toBe(false);
    expect(rowHiddenByFeed(curated, { view: "curated" })).toBe(false);
    expect(rowHiddenByFeed(open(), { view: "curated" })).toBe(true);
  });

  it("follows the flagged lens and the excluded view", () => {
    expect(rowHiddenByFeed(open("flagged"), { flagged: true })).toBe(false);
    expect(rowHiddenByFeed(open("reviewed"), { flagged: "1" })).toBe(true);
    expect(rowHiddenByFeed(open(), { flagged: true })).toBe(true);
    const excluded = open(null, { excluded_reason: "abuser" });
    expect(rowHiddenByFeed(excluded, {})).toBe(true);
    expect(rowHiddenByFeed(excluded, { view: "excluded" })).toBe(false);
    // rep_low is served on every public view, so it is not a reason to leave.
    expect(rowHiddenByFeed(open(null, { excluded_reason: "rep_low" }), {})).toBe(false);
  });
});
