import { vi } from "vitest";
import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient, mockEntry, createTestQueryClient } from "@/specs/test-utils";

// Log a user in so LoginRequired renders the button and the vote slider can mount.
vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: vi.fn(() => ({
    activeUser: { username: "alice" },
    username: "alice",
    account: null,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: true,
    error: null,
    refetch: vi.fn()
  }))
}));

// The component reads its entry through EcencyEntriesCacheManagement.getEntryQuery.
// Stub it to a plain query whose initialData is the passed entry (renders sync, no network).
vi.mock("@/core/caches", () => ({
  EcencyEntriesCacheManagement: {
    getEntryQuery: (initialEntry: any) => ({
      queryKey: ["entry", initialEntry?.author, initialEntry?.permlink],
      queryFn: () => initialEntry,
      initialData: initialEntry,
      enabled: !!initialEntry
    })
  }
}));

vi.mock("@/api/mutations", () => ({
  useEntryVote: () => ({ mutateAsync: vi.fn(), isPending: false })
}));

// prepareVotes() reads parseAsset/parseDate from the globally-mocked @/utils; pass the
// fetched votes straight through so the test doesn't depend on those internals.
vi.mock("@/features/shared/entry-vote-btn/utils", () => ({
  prepareVotes: (_entry: any, votes: any[]) => votes
}));

// The slider dialog is loaded via next/dynamic and pulls in SDK vote-value queries we
// don't exercise here. Replace it with a marker that records the previousVotedValue prop
// it receives, so we can assert (a) it mounts and (b) the resolved value reaches it.
vi.mock("@/features/shared/entry-vote-btn/entry-vote-dialog", () => ({
  EntryVoteDialog: ({ previousVotedValue }: { previousVotedValue: number | undefined }) => (
    <div data-testid="vote-dialog">
      prev:{previousVotedValue === undefined ? "none" : previousVotedValue}
    </div>
  )
}));

import { EntryVoteBtn } from "@/features/shared/entry-vote-btn";

describe("EntryVoteBtn — opening the slider is not blocked on the previous-vote fetch (INP)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });
  afterEach(() => vi.clearAllMocks());

  it("opens the slider while the previous-vote fetch is still pending, then forwards the resolved value", async () => {
    // An already-upvoted post: opening the slider takes getPreviousVote()'s network
    // branch (session-cache miss -> queryClient.fetchQuery for the prior vote weight).
    const entry = mockEntry({
      author: "bob",
      permlink: "a-post",
      post_id: 999,
      active_votes: [{ voter: "alice", rshares: 100 }] as any
    });

    const queryClient = createTestQueryClient();
    // Hold the previous-vote fetch open so we can prove the dialog opens before it resolves.
    let resolveFetch: (v: any) => void = () => {};
    const fetchPromise = new Promise((res) => (resolveFetch = res));
    const fetchSpy = vi.spyOn(queryClient, "fetchQuery").mockReturnValue(fetchPromise as any);

    renderWithQueryClient(<EntryVoteBtn entry={entry} isPostSlider={true} />, { queryClient });

    // Open the slider.
    fireEvent.click(screen.getByRole("button"));

    // The slider appears even though the previous-vote fetch is still pending — i.e. the
    // open did NOT await the network call. That await used to block the open and inflate INP.
    const dialog = await screen.findByTestId("vote-dialog");
    expect(dialog).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveTextContent("prev:none"); // value not resolved yet

    // Once the fetch resolves, the prior vote weight (75%) is forwarded to the slider.
    resolveFetch([{ voter: "alice", percent: 75, rshares: 100, time: "2024-01-01T00:00:00" }]);
    await waitFor(() => expect(screen.getByTestId("vote-dialog")).toHaveTextContent("prev:75"));
  });

  it("toggles the slider closed on a second click", async () => {
    const entry = mockEntry({ author: "bob", permlink: "b-post", post_id: 1000, active_votes: [] });
    renderWithQueryClient(<EntryVoteBtn entry={entry} isPostSlider={true} />);

    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByTestId("vote-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.queryByTestId("vote-dialog")).not.toBeInTheDocument());
  });

  it("does not seed a reused button's slider with the previous post's vote", async () => {
    const entryA = mockEntry({
      author: "bob",
      permlink: "a",
      post_id: 1,
      active_votes: [{ voter: "alice", rshares: 100 }] as any
    });
    const entryB = mockEntry({
      author: "carol",
      permlink: "b",
      post_id: 2,
      active_votes: [{ voter: "alice", rshares: 50 }] as any
    });

    const queryClient = createTestQueryClient();
    // First open (A) resolves to 75%; the second open (B) stays pending so that any
    // leaked value would have to come from A's cached previousVotedValue, not B's fetch.
    let calls = 0;
    let resolveA: (v: any) => void = () => {};
    vi.spyOn(queryClient, "fetchQuery").mockImplementation((() => {
      calls += 1;
      if (calls === 1) return new Promise((res) => (resolveA = res));
      return new Promise(() => {});
    }) as any);

    const utils = renderWithQueryClient(<EntryVoteBtn entry={entryA} isPostSlider={true} />, {
      queryClient
    });

    fireEvent.click(screen.getByRole("button"));
    await screen.findByTestId("vote-dialog");
    resolveA([{ voter: "alice", percent: 75, rshares: 100, time: "2024-01-01T00:00:00" }]);
    await waitFor(() => expect(screen.getByTestId("vote-dialog")).toHaveTextContent("prev:75"));

    // Close, then reuse the SAME button instance for a different post.
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.queryByTestId("vote-dialog")).not.toBeInTheDocument());
    utils.rerender(<EntryVoteBtn entry={entryB} isPostSlider={true} />);

    // Open B (its fetch is pending): the slider must not be seeded with A's 75%.
    fireEvent.click(screen.getByRole("button"));
    const dialogB = await screen.findByTestId("vote-dialog");
    expect(dialogB).toHaveTextContent("prev:none");
  });
});
