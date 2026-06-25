import { vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom";
import { EntryPayout } from "@/features/shared/entry-payout";
import { createTestQueryClient, mockEntry, renderWithQueryClient } from "@/specs/test-utils";

// The component imports FormattedCurrency from the @/features/shared barrel,
// which pulls in many heavy components. Replace it with a deterministic stub so
// we can assert on the exact numeric value the component decides to show.
vi.mock("@/features/shared", () => ({
  FormattedCurrency: ({ value, fixAt = 2 }: { value: number; fixAt?: number }) => (
    <span data-testid="formatted-currency">{`$${value.toFixed(fixAt)}`}</span>
  )
}));

// The global @/utils mock only exposes random + getAccessToken, but EntryPayout
// relies on the real parseAsset to turn "1.234 HBD" strings into numbers.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// EntryPayout now subscribes to the entry cache (like EntryVotes). Bridge
// getEntryQuery to a plain query keyed by author/permlink whose initialData is
// the passed entry, so each test renders from its prop and can also drive the
// cached value directly.
vi.mock("@/core/caches", () => ({
  EcencyEntriesCacheManagement: {
    getEntryQuery: (initialEntry: any) => ({
      queryKey: ["entry", initialEntry?.author, initialEntry?.permlink],
      queryFn: () => initialEntry,
      initialData: initialEntry,
      // No mount refetch, so a setQueryData (the optimistic vote update) is not
      // clobbered by the stub queryFn returning the stale initialEntry.
      staleTime: Infinity,
      enabled: !!initialEntry
    })
  }
}));

// EntryPayoutDetail (rendered lazily inside the popover) reads the dynamic-props
// query; keep it inert so it never throws if the portal ever mounts.
vi.mock("@/features/shared/entry-payout/entry-payout-detail", () => ({
  EntryPayoutDetail: () => null
}));

describe("EntryPayout", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the summed pending + author + curator payout, formatted to 3 decimals", () => {
    const entry = mockEntry({
      max_accepted_payout: "1000000.000 HBD",
      pending_payout_value: "1.500 HBD",
      author_payout_value: "0.000 HBD",
      curator_payout_value: "0.000 HBD",
      id: undefined,
      post_id: 42
    });

    const { getByTestId } = renderWithQueryClient(<EntryPayout entry={entry} />);

    // 1.500 + 0 + 0 = 1.5, FormattedCurrency stub renders with fixAt=3
    expect(getByTestId("formatted-currency")).toHaveTextContent("$1.500");
  });

  it("adds the author and curator payouts to the pending value for paid-out posts", () => {
    const entry = mockEntry({
      max_accepted_payout: "1000000.000 HBD",
      pending_payout_value: "0.000 HBD",
      author_payout_value: "2.250 HBD",
      curator_payout_value: "0.750 HBD",
      id: undefined,
      post_id: 7
    });

    const { getByTestId } = renderWithQueryClient(<EntryPayout entry={entry} />);

    // 0 + 2.25 + 0.75 = 3.0
    expect(getByTestId("formatted-currency")).toHaveTextContent("$3.000");
  });

  it("marks the badge as payout-declined when max_accepted_payout is zero", () => {
    const entry = mockEntry({
      max_accepted_payout: "0.000 HBD",
      pending_payout_value: "0.000 HBD",
      author_payout_value: "0.000 HBD",
      curator_payout_value: "0.000 HBD",
      id: undefined,
      post_id: 99
    });

    const { container } = renderWithQueryClient(<EntryPayout entry={entry} />);

    const badge = container.querySelector(".entry-payout");
    expect(badge).not.toBeNull();
    expect(badge).toHaveClass("payout-declined");
    // Declined posts have max=0 and total=0, so totalPayout >= maxPayout (0 >= 0)
    // is also true — the limit-hit flag rides along.
    expect(badge).toHaveClass("payout-limit-hit");
  });

  it("caps the shown value at maxPayout and flags payout-limit-hit when the limit is reached", () => {
    const entry = mockEntry({
      max_accepted_payout: "10.000 HBD",
      pending_payout_value: "15.000 HBD",
      author_payout_value: "0.000 HBD",
      curator_payout_value: "0.000 HBD",
      id: undefined,
      post_id: 5
    });

    const { container, getByTestId } = renderWithQueryClient(<EntryPayout entry={entry} />);

    const badge = container.querySelector(".entry-payout");
    expect(badge).toHaveClass("payout-limit-hit");
    // total (15) >= max (10), so the capped maxPayout (10) is shown, not 15.
    expect(getByTestId("formatted-currency")).toHaveTextContent("$10.000");
  });

  it("uses entry.payout directly for search results (numeric payout, no max_accepted_payout)", () => {
    const entry = mockEntry({
      id: 123, // present only in search results
      payout: 4.2,
      // Real search-API results expose a numeric payout and have NO asset-string
      // payout fields, so the search branch is taken and entry.payout is shown.
      pending_payout_value: "99.000 HBD",
      author_payout_value: "0.000 HBD",
      curator_payout_value: "0.000 HBD",
      max_accepted_payout: undefined
    });

    const { getByTestId } = renderWithQueryClient(<EntryPayout entry={entry} />);

    // search branch: shownPayout = entry.payout = 4.2 (asset strings ignored)
    expect(getByTestId("formatted-currency")).toHaveTextContent("$4.200");
  });

  it("sums payout for wave entries (id set + asset-string payouts, no numeric payout)", () => {
    // Post-normalizer wave entry: has an id (like a search result) AND
    // max_accepted_payout + asset-string payouts but no numeric payout. It must
    // NOT take the search branch (which would render $0.000) — it sums instead.
    const entry = mockEntry({
      id: 4242,
      payout: undefined,
      max_accepted_payout: "1000000.000 HBD",
      pending_payout_value: "1.234 HBD",
      author_payout_value: "0.000 HBD",
      curator_payout_value: "0.000 HBD"
    });

    const { getByTestId } = renderWithQueryClient(<EntryPayout entry={entry} />);

    expect(getByTestId("formatted-currency")).toHaveTextContent("$1.234");
  });

  it("falls back to 0 when there is no max_accepted_payout and no search payout", () => {
    const entry = mockEntry({
      max_accepted_payout: undefined,
      id: undefined,
      post_id: 0
    });

    const { getByTestId } = renderWithQueryClient(<EntryPayout entry={entry} />);

    expect(getByTestId("formatted-currency")).toHaveTextContent("$0.000");
  });

  // Regression (waves): the action bar receives the original feed row as its
  // prop, so EntryPayout must read from the entry cache (not the prop) for an
  // optimistic vote's payout bump to render before the feed refetches. Here the
  // cache (as written by the optimistic vote update) holds a bumped payout while
  // the prop still has the stale feed value.
  it("renders payout from the entry cache, not the stale prop", () => {
    const entry = mockEntry({
      author: "alice",
      permlink: "wave-1",
      max_accepted_payout: "1000000.000 HBD",
      pending_payout_value: "0.000 HBD",
      author_payout_value: "0.000 HBD",
      curator_payout_value: "0.000 HBD",
      id: undefined,
      post_id: 4242
    });

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["entry", "alice", "wave-1"], {
      ...entry,
      pending_payout_value: "1.500 HBD"
    });

    const { getByTestId } = renderWithQueryClient(<EntryPayout entry={entry} />, { queryClient });

    expect(getByTestId("formatted-currency")).toHaveTextContent("$1.500");
  });
});
