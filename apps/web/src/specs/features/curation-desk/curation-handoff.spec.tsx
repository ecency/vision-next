import React from "react";
import "@testing-library/jest-dom";
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CurationHandoffEntry } from "@ecency/sdk";
import { renderWithQueryClient } from "@/specs/test-utils";

vi.mock("@ecency/sdk", async () => ({ ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")) }));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/utils")),
  dateToRelative: () => "2 hours ago",
}));
vi.mock("@/features/shared/user-avatar", () => ({ UserAvatar: () => <span /> }));

import { CurationHandoffBar } from "@/features/curation-desk/curation-handoff-bar";
import { describeLane, isSameUtcDay, orderHandoff } from "@/features/curation-desk/curation-handoff";

const NOW = Date.parse("2026-09-07T12:00:00.000Z");

function entry(over: Partial<CurationHandoffEntry> = {}): CurationHandoffEntry {
  return {
    username: "melinda010100",
    reviewed_to: "2026-09-07T08:14:00",
    reviewed_to_post_id: 42,
    last_mark_at: "2026-09-07T10:00:00",
    marks_24h: 14,
    ...over,
  };
}

describe("describeLane", () => {
  it("names the whole queue when nothing narrows it", () => {
    expect(describeLane({})).toBe("curation-desk.handoff.lane-all");
  });

  it("reuses the refine panel's own labels, so one filter never reads two ways", () => {
    expect(describeLane({ app: "peakd" })).toBe("curation-desk.filters.app-peakd");
    expect(describeLane({ new_authors: true })).toBe("curation-desk.filters.new-authors");
  });

  /**
   * A curator who is not hiding handled rows is re-reading rather than
   * advancing, so their position claims less than it looks like.
   */
  it("says so when the curator is re-reading handled posts", () => {
    expect(describeLane({ hide_reviewed: false })).toBe("curation-desk.handoff.lane-rereading");
  });

  it("keeps the line short by naming two facets and counting the rest", () => {
    expect(
      describeLane({ app: "peakd", window: "full", new_authors: true, recommended: true })
    ).toBe("curation-desk.handoff.lane-more");
  });

  it("prefers the community's title over its id, and says nothing without a lane", () => {
    expect(describeLane({ community: "hive-125125" }, "Photography")).toBe("Photography");
    expect(describeLane(undefined)).toBe("");
  });
});

describe("orderHandoff", () => {
  it("puts the viewer first, so their own line does not move as colleagues work", () => {
    const rows = orderHandoff(
      [entry({ username: "seckorama" }), entry({ username: "me" }), entry({ username: "dunsky" })],
      "me"
    );
    expect(rows.map((r) => r.username)).toEqual(["me", "seckorama", "dunsky"]);
  });

  it("is empty for nothing at all", () => {
    expect(orderHandoff(undefined, "me")).toEqual([]);
    expect(orderHandoff([], "me")).toEqual([]);
  });
});

describe("isSameUtcDay", () => {
  it("separates today from an earlier date, which is what a bare HH:MM cannot", () => {
    expect(isSameUtcDay("2026-09-07T08:14:00", NOW)).toBe(true);
    expect(isSameUtcDay("2026-09-05T23:59:00", NOW)).toBe(false);
    expect(isSameUtcDay(null, NOW)).toBe(false);
  });
});

describe("CurationHandoffBar", () => {
  it("shows one line per curator, the viewer first and named as themselves", () => {
    renderWithQueryClient(
      <CurationHandoffBar
        entries={[entry({ username: "seckorama", marks_24h: 3 }), entry({ username: "me" })]}
        username="me"
        live
        now={NOW}
      />
    );
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("curation-desk.handoff.you")).toBeInTheDocument();
    expect(within(rows[1]).getByText("@seckorama")).toBeInTheDocument();
  });

  /**
   * A hand-off is exactly the case where this morning and three days ago differ,
   * and a bare HH:MM cannot tell them apart.
   */
  it("prints a date on a position that is not from today", () => {
    renderWithQueryClient(
      <CurationHandoffBar entries={[entry()]} username="me" live now={NOW} />
    );
    expect(screen.getByText("curation-desk.handoff.to-time")).toBeInTheDocument();

    renderWithQueryClient(
      <CurationHandoffBar
        entries={[entry({ reviewed_to: "2026-09-04T08:14:00" })]}
        username="me"
        live
        now={NOW}
      />
    );
    expect(screen.getAllByText("curation-desk.handoff.to-date").length).toBeGreaterThan(0);
  });

  it("says the queue is untouched rather than rendering nothing", () => {
    renderWithQueryClient(<CurationHandoffBar entries={[]} username="me" live now={NOW} />);
    expect(screen.getByText("curation-desk.handoff.empty")).toBeInTheDocument();
  });

  it("says so when the tick has paused, rather than showing a stale bar as live", () => {
    renderWithQueryClient(
      <CurationHandoffBar entries={[entry()]} username="me" live={false} now={NOW} />
    );
    expect(screen.getByText("curation-desk.handoff.paused")).toBeInTheDocument();
  });

  /** A trial viewer gets positions but no count for anyone but themselves. */
  it("renders a curator whose count the backend withheld", () => {
    renderWithQueryClient(
      <CurationHandoffBar
        entries={[entry({ username: "seckorama", marks_24h: undefined })]}
        username="trial1"
        live
        now={NOW}
      />
    );
    expect(screen.getByText("@seckorama")).toBeInTheDocument();
    expect(screen.queryByText("curation-desk.handoff.marks")).toBeNull();
  });

  it("renders a position a backend without the lane still answers", () => {
    renderWithQueryClient(
      <CurationHandoffBar entries={[entry({ lane: undefined })]} username="me" live now={NOW} />
    );
    expect(screen.getByRole("listitem")).toBeInTheDocument();
    expect(screen.queryByText("curation-desk.handoff.lane-all")).toBeNull();
  });
});
