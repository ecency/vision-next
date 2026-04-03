import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient, mockEntry } from "@/specs/test-utils";
import { useActiveAccount } from "@/core/hooks/use-active-account";

vi.mock("@/core/hooks/use-active-account");

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual("@ecency/sdk");
  return {
    ...actual,
    getDiscussionsQueryOptions: vi.fn(() => ({
      queryKey: ["discussions"],
      queryFn: vi.fn().mockResolvedValue([]),
      enabled: true
    })),
    SortOrder: { created: "created", trending: "trending", votes: "votes", author_reputation: "author_reputation" }
  };
});

vi.mock("./entry-page-discussions", () => ({
  EntryPageDiscussions: () => <div data-testid="discussions-content">Discussions loaded</div>
}));

// Must import after mocks
const { EntryPageDiscussionsWrapper } = await import(
  "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-discussions-wrapper"
);

describe("EntryPageDiscussionsWrapper", () => {
  const entry = mockEntry({ children: 5, author: "testuser", permlink: "test-post" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Show comments' button for anonymous users", () => {
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: null,
      username: null,
      account: null,
      isLoading: false,
      isPending: false
    } as any);

    renderWithQueryClient(
      <EntryPageDiscussionsWrapper entry={entry} category="test" />
    );

    expect(screen.getByText(/Show 5 comments/i)).toBeInTheDocument();
  });

  it("does not show button when entry has no comments and user is anonymous", () => {
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: null,
      username: null,
      account: null,
      isLoading: false,
      isPending: false
    } as any);

    const noComments = mockEntry({ children: 0 });
    const { container } = renderWithQueryClient(
      <EntryPageDiscussionsWrapper entry={noComments} category="test" />
    );

    expect(container.innerHTML).toBe("");
  });

  it("auto-loads discussions for logged-in users", () => {
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: { username: "loggedin" },
      username: "loggedin",
      account: null,
      isLoading: false,
      isPending: false
    } as any);

    renderWithQueryClient(
      <EntryPageDiscussionsWrapper entry={entry} category="test" />
    );

    // Should NOT show the button - should show skeleton/loading instead
    expect(screen.queryByText(/Show 5 comments/i)).not.toBeInTheDocument();
  });
});
