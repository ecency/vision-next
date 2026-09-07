import { periodStartLabel, sentIssueSentAt } from "@/features/newsletter/sent-issues";
import { describe, expect, it } from "vitest";

// The rows that made the bug visible: the @ecency profile card on Mon 2026-09-07
// showed 8/24, 8/17 and 8/10 for issues that actually went out on 8/31, 8/24 and
// 8/21. Newest first the whole way down, but every date a period behind the send.
const ROWS = [
  { period_start: "2026-08-24", created_at: "2026-08-31T09:00:07.359Z" },
  { period_start: "2026-08-17", created_at: "2026-08-24T09:00:07.184Z" },
  { period_start: "2026-08-10", created_at: "2026-08-21T05:20:02.909Z" }
];

describe("sentIssueSentAt", () => {
  it("reads the send moment, not the start of the period it covers", () => {
    const at = sentIssueSentAt(ROWS[0]);
    expect(at?.toISOString()).toBe("2026-08-31T09:00:07.359Z");
    // The distinction the card was getting wrong: a week apart on a weekly digest.
    expect(at?.toISOString().slice(0, 10)).not.toBe(ROWS[0].period_start);
  });

  it("reads a send that trailed its period by more than a week", () => {
    // 2026-08-10's issue did not leave until 8/21, so period_start understated it by 11 days.
    expect(sentIssueSentAt(ROWS[2])?.toISOString()).toBe("2026-08-21T05:20:02.909Z");
  });

  it("returns null rather than an Invalid Date the row would render verbatim", () => {
    expect(sentIssueSentAt({ created_at: "" })).toBeNull();
    expect(sentIssueSentAt({ created_at: "not a date" })).toBeNull();
    expect(sentIssueSentAt({ created_at: undefined as unknown as string })).toBeNull();
  });
});

describe("periodStartLabel", () => {
  it("keeps period_start on UTC so the date is not pulled back a day", () => {
    // A plain date, not an instant: parsed as local time it becomes the 23rd west of UTC.
    expect(periodStartLabel("2026-08-24", "en-US")).toBe("8/24/2026");
  });

  it("falls back to the raw value when the period is unparseable", () => {
    expect(periodStartLabel("nonsense", "en-US")).toBe("nonsense");
  });
});
