import { NewsletterRuntimeProvider } from "@/features/newsletter/runtime";
import {
  SentIssues,
  periodStartLabel,
  sentIssueSentAt
} from "@/features/newsletter/sent-issues";
import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "@/specs/test-utils";

// The component reads its rows through this; the wire format is pinned by the api specs.
vi.mock("@/features/newsletter/author-send-api", () => ({
  authorSendApi: { issues: vi.fn() }
}));

// The global mock has no active user, and the query is gated on one.
vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: vi.fn(() => ({ activeUser: { username: "ecency" }, username: "ecency" }))
}));

// The global i18next mock drops interpolation params, which is exactly what the period
// tooltip carries. Keep keys as-is but append the params so the title stays assertable.
vi.mock("i18next", () => ({
  __esModule: true,
  default: {
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${Object.values(params).join(",")}` : key,
    language: "en-US"
  }
}));

import { authorSendApi } from "@/features/newsletter/author-send-api";

// The rows that made the bug visible: the @ecency profile card on Mon 2026-09-07 showed
// 8/24, 8/17 and 8/10 for issues that actually went out on 8/31, 8/24 and 8/21. Newest
// first the whole way down, but every date a period behind the send.
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

// The rendered card, which is what the reader actually judges. Dates below are asserted as
// en-US on UTC: the i18next mock pins the locale and CI runs UTC, and the send instants sit
// mid-morning so the calendar date is stable either side of the meridian.
describe("SentIssues", () => {
  const issue = (over: Record<string, unknown>) => ({
    id: `id-${over.period_start}`,
    cadence: "weekly",
    kind: "digest",
    subject: `@ecency's weekly digest, ${over.period_start}`,
    status: "sent",
    post_author: null,
    post_permlink: null,
    requested_by: null,
    delivered: 3,
    bounced: 0,
    rejected: 0,
    ...over
  });

  const renderCard = () =>
    renderWithQueryClient(
      <NewsletterRuntimeProvider configured={true}>
        <SentIssues type="creator" target="ecency" isSender={true} />
      </NewsletterRuntimeProvider>
    );

  beforeEach(() => {
    vi.mocked(authorSendApi.issues).mockReset();
  });

  it("dates the row by its send, not by the period it covers", async () => {
    // One row on purpose: across the full set 8/24 is also row two's SEND date, which would
    // make an absence check pass for the wrong reason.
    vi.mocked(authorSendApi.issues).mockResolvedValue([issue(ROWS[0])] as never);
    renderCard();

    // The regression: this row read 8/24/2026, the period start, for an issue sent on 8/31.
    expect(await screen.findByText("8/31/2026")).toBeInTheDocument();
    expect(screen.queryByText("8/24/2026")).not.toBeInTheDocument();
  });

  it("carries the send instant in dateTime and the covered period in the title", async () => {
    vi.mocked(authorSendApi.issues).mockResolvedValue([issue(ROWS[0])] as never);
    renderCard();

    const time = await screen.findByText("8/31/2026");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-08-31T09:00:07.359Z");
    // The period is not lost, it moves to the tooltip.
    expect(time).toHaveAttribute("title", "newsletter.sent-issue-period:8/24/2026");
  });

  it("falls back to the period when the send timestamp is unusable", async () => {
    vi.mocked(authorSendApi.issues).mockResolvedValue([
      issue({ period_start: "2026-08-24", created_at: "not a date" })
    ] as never);
    renderCard();

    // No "Invalid Date" in the card, and dateTime degrades to the plain period date.
    const time = await screen.findByText("8/24/2026");
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
    expect(time).toHaveAttribute("datetime", "2026-08-24");
  });

  it("renders the newest first and stops at the limit", async () => {
    const fourth = { period_start: "2026-08-03", created_at: "2026-08-10T09:00:00.000Z" };
    vi.mocked(authorSendApi.issues).mockResolvedValue(
      [...ROWS, fourth].map(issue) as never
    );
    const { container } = renderCard();

    await screen.findByText("8/31/2026");
    const dates = Array.from(container.querySelectorAll("time")).map((t) => t.textContent);
    // Order is the API's, newest first, and the default limit of 3 cuts the oldest row.
    expect(dates).toEqual(["8/31/2026", "8/24/2026", "8/21/2026"]);
    expect(screen.queryByText("8/10/2026")).not.toBeInTheDocument();
  });
});
