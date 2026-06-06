import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { Announcements } from "@/features/announcement";

interface MockAnnouncement {
  id: number;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  path: string | string[];
  auth: boolean;
  proposal_ids?: number[];
}

interface MockVote {
  proposal?: { proposal_id: number };
}

interface MockActiveAccount {
  activeUser: { username: string } | null;
  username: string | null;
}

interface MockQueryOptions {
  queryKey?: readonly unknown[];
}

const { announcementsRef, votesRef, votesResolvedRef, usernameRef, accountMemo } = vi.hoisted(() => ({
  announcementsRef: { current: [] as MockAnnouncement[] },
  votesRef: { current: [] as MockVote[] },
  // Mirrors the votes query's `isSuccess`: true once the lookup has resolved
  // with data, false while loading or on error.
  votesResolvedRef: { current: true },
  usernameRef: { current: "alice" as string | null },
  // Caches the returned account object so its `activeUser` keeps a stable
  // reference across renders for a given username. The real useActiveAccount
  // sources activeUser from the zustand store (stable); returning a fresh object
  // every call would make the superList useMemo (which deps on activeUser)
  // recompute each render and refire the setList effect — an infinite loop.
  accountMemo: {
    key: undefined as string | null | undefined,
    value: null as MockActiveAccount | null
  }
}));

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: (): MockActiveAccount => {
    if (accountMemo.key !== usernameRef.current) {
      accountMemo.key = usernameRef.current;
      accountMemo.value = {
        activeUser: usernameRef.current ? { username: usernameRef.current } : null,
        username: usernameRef.current
      };
    }
    return accountMemo.value!;
  }
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/"
}));

// Distinct query keys so the useQuery mock below can tell the two queries apart.
vi.mock("@ecency/sdk", () => ({
  getAnnouncementsQueryOptions: (): MockQueryOptions & {
    queryFn: () => Promise<MockAnnouncement[]>;
  } => ({
    queryKey: ["notifications", "announcements"],
    queryFn: async () => announcementsRef.current
  }),
  getUserProposalVotesQueryOptions: (
    voter: string
  ): MockQueryOptions & { queryFn: () => Promise<MockVote[]> } => ({
    queryKey: ["proposals", "votes", "by-user", voter],
    queryFn: async () => votesRef.current
  })
}));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: (opts: MockQueryOptions) =>
    opts?.queryKey?.[0] === "proposals"
      ? { data: votesRef.current, isSuccess: votesResolvedRef.current }
      : { data: announcementsRef.current }
}));

// Stub the inline action so the test doesn't pull in the vote mutation / SDK
// broadcast stack; we only care which announcements the parent decides to show.
vi.mock("@/features/announcement/proposal-vote-action", () => ({
  ProposalVoteAction: ({ proposalId }: { proposalId: number }) => (
    <div data-testid="proposal-vote-action">pva:{proposalId}</div>
  )
}));

const proposalAnnouncement: MockAnnouncement = {
  id: 1,
  title: "Support Ecency proposal",
  description: "Please support us",
  button_text: "Support now",
  button_link: "/proposals/379",
  path: "/",
  auth: true,
  proposal_ids: [379]
};

const plainAnnouncement: MockAnnouncement = {
  id: 2,
  title: "Welcome to Ecency",
  description: "Check out the new release",
  button_text: "Read more",
  button_link: "/about",
  path: "/",
  auth: false
};

describe("Announcements proposal filtering", () => {
  beforeEach(() => {
    localStorage.clear();
    announcementsRef.current = [];
    votesRef.current = [];
    votesResolvedRef.current = true;
    usernameRef.current = "alice";
  });

  it("shows a proposal announcement the user has not voted on", async () => {
    announcementsRef.current = [proposalAnnouncement];
    votesRef.current = [];

    render(<Announcements />);

    expect(await screen.findByText("Support Ecency proposal")).toBeInTheDocument();
    expect(screen.getByTestId("proposal-vote-action")).toHaveTextContent("pva:379");
  });

  it("hides a proposal announcement the user has already voted on", () => {
    announcementsRef.current = [proposalAnnouncement];
    votesRef.current = [{ proposal: { proposal_id: 379 } }];

    render(<Announcements />);

    expect(screen.queryByText("Support Ecency proposal")).not.toBeInTheDocument();
    expect(screen.queryByTestId("proposal-vote-action")).not.toBeInTheDocument();
  });

  it("ignores votes for other proposals when deciding visibility", async () => {
    announcementsRef.current = [proposalAnnouncement];
    votesRef.current = [{ proposal: { proposal_id: 283 } }];

    render(<Announcements />);

    expect(await screen.findByText("Support Ecency proposal")).toBeInTheDocument();
  });

  it("never hides non-proposal announcements based on votes", async () => {
    announcementsRef.current = [plainAnnouncement];
    votesRef.current = [{ proposal: { proposal_id: 379 } }];

    render(<Announcements />);

    expect(await screen.findByText("Welcome to Ecency")).toBeInTheDocument();
  });

  it("filters only the voted proposal out of a mixed list, keeping siblings", async () => {
    announcementsRef.current = [proposalAnnouncement, plainAnnouncement];
    votesRef.current = [{ proposal: { proposal_id: 379 } }];

    render(<Announcements />);

    // The voted proposal is dropped; the surviving sibling is the one surfaced.
    expect(await screen.findByText("Welcome to Ecency")).toBeInTheDocument();
    expect(screen.queryByText("Support Ecency proposal")).not.toBeInTheDocument();
  });

  it("holds a proposal announcement back until the votes resolve", () => {
    announcementsRef.current = [proposalAnnouncement];
    votesRef.current = [];
    votesResolvedRef.current = false; // votes query still loading (or errored)

    render(<Announcements />);

    expect(screen.queryByText("Support Ecency proposal")).not.toBeInTheDocument();
  });

  it("shows proposal announcements to logged-out users without waiting on a (disabled) votes query", async () => {
    // For logged-out users the votes query is disabled and never resolves
    // (isSuccess stays false); the `!username` short-circuit must still let an
    // open proposal announcement through. auth:false so the auth filter doesn't
    // hide it for an unrelated reason.
    usernameRef.current = null;
    votesResolvedRef.current = false;
    announcementsRef.current = [{ ...proposalAnnouncement, auth: false }];
    votesRef.current = [];

    render(<Announcements />);

    expect(await screen.findByText("Support Ecency proposal")).toBeInTheDocument();
  });

  it("keeps an announcement with an empty proposal_ids array visible even before votes resolve", async () => {
    // proposal_ids: [] takes the non-proposal short-circuit and must win over
    // the votes-ready gate.
    votesResolvedRef.current = false;
    announcementsRef.current = [{ ...proposalAnnouncement, proposal_ids: [] }];

    render(<Announcements />);

    expect(await screen.findByText("Support Ecency proposal")).toBeInTheDocument();
  });

  it("removes the card live once the user's votes update to include the proposal", async () => {
    // The parent reads the same votes query key as the inline action, so after
    // an inline vote the mutation's cache invalidation flows new vote data in
    // and the card must disappear on the mounted component (guards the useMemo
    // deps + shared-cache contract).
    announcementsRef.current = [proposalAnnouncement];
    votesRef.current = [];

    const { rerender } = render(<Announcements />);
    expect(await screen.findByText("Support Ecency proposal")).toBeInTheDocument();

    votesRef.current = [{ proposal: { proposal_id: 379 } }];
    rerender(<Announcements />);

    await waitFor(() =>
      expect(screen.queryByText("Support Ecency proposal")).not.toBeInTheDocument()
    );
  });

  it("appends a dismissed id to dismiss_announcements without clobbering existing ids", () => {
    // Regression anchor for the dismissClick dedup fix. The dedup *guard* itself
    // is defensive and unreachable through the UI — an announcement whose id is
    // already stored is filtered out of the list, so it can't be dismissed
    // twice — but this exercises the reachable write/append branch the fix lives
    // in: an existing id is preserved and the new id is appended (the old code
    // read `.id` off a bare number while building this same array).
    localStorage.setItem("ecency_dismiss_announcements", JSON.stringify([99]));
    announcementsRef.current = [plainAnnouncement]; // id 2, non-proposal → always shown
    const { container } = render(<Announcements />);

    const closeButton = container.querySelector(".close-btn");
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton as Element);

    expect(JSON.parse(localStorage.getItem("ecency_dismiss_announcements") as string)).toEqual([
      99, 2
    ]);
  });
});
