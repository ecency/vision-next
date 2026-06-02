import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ProposalVoteAction } from "@/features/announcement/proposal-vote-action";

const { votesRef, voteMock, successMock } = vi.hoisted(() => ({
  votesRef: { current: [] as { proposal?: { proposal_id: number } }[] },
  voteMock: vi.fn(),
  successMock: vi.fn()
}));

vi.mock("@/core/hooks/use-active-username", () => ({
  useActiveUsername: () => "alice"
}));

vi.mock("@/api/sdk-mutations", () => ({
  useProposalVoteMutation: () => ({ mutateAsync: voteMock, isPending: false })
}));

vi.mock("@/features/shared", () => ({
  success: successMock
}));

vi.mock("@ecency/sdk", () => ({
  getUserProposalVotesQueryOptions: () => ({
    queryKey: ["user-proposal-votes", "alice"],
    queryFn: async () => votesRef.current
  })
}));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: () => ({ data: votesRef.current })
}));

describe("ProposalVoteAction", () => {
  beforeEach(() => {
    voteMock.mockReset().mockResolvedValue(true);
    successMock.mockReset();
    votesRef.current = [];
  });

  it("casts an approve vote and dismisses on success", async () => {
    const onSupported = vi.fn();
    render(
      <ProposalVoteAction
        proposalId={379}
        buttonText="Support now"
        viewLink="/proposals/379"
        onSupported={onSupported}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Support now" }));

    await waitFor(() => expect(voteMock).toHaveBeenCalledWith({ approve: true }));
    await waitFor(() => expect(onSupported).toHaveBeenCalledTimes(1));
    expect(successMock).toHaveBeenCalled();
  });

  it("swallows a rejected vote without dismissing or showing success", async () => {
    voteMock.mockReset().mockRejectedValueOnce(new Error("Broadcast failed"));
    const onSupported = vi.fn();
    render(
      <ProposalVoteAction
        proposalId={379}
        buttonText="Support now"
        viewLink="/proposals/379"
        onSupported={onSupported}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Support now" }));

    await waitFor(() => expect(voteMock).toHaveBeenCalledWith({ approve: true }));
    expect(onSupported).not.toHaveBeenCalled();
    expect(successMock).not.toHaveBeenCalled();
  });

  it("shows a confirmation (and no support button) when the user already voted", () => {
    votesRef.current = [{ proposal: { proposal_id: 379 } }];

    render(
      <ProposalVoteAction
        proposalId={379}
        buttonText="Support now"
        viewLink="/proposals/379"
        onSupported={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Support now" })).toBeNull();
    expect(screen.getByText("announcements.voted")).toBeInTheDocument();
  });

  it("ignores votes for other proposals when deciding the voted state", () => {
    votesRef.current = [{ proposal: { proposal_id: 283 } }];

    render(
      <ProposalVoteAction
        proposalId={379}
        buttonText="Support now"
        viewLink="/proposals/379"
        onSupported={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Support now" })).toBeInTheDocument();
  });

  it("always offers a link to view the proposal", () => {
    render(
      <ProposalVoteAction
        proposalId={379}
        buttonText="Support now"
        viewLink="/proposals/379"
        onSupported={vi.fn()}
      />
    );

    const link = screen.getByText("announcements.view-proposal").closest("a");
    expect(link).toHaveAttribute("href", "/proposals/379");
  });
});
