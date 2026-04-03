import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient, mockEntry } from "@/specs/test-utils";
import { useActiveAccount } from "@/core/hooks/use-active-account";

vi.mock("@/utils", async () => {
  const actual = await vi.importActual("@/utils");
  return { ...actual as any };
});

vi.mock("@/core/hooks/use-active-account");

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual("@ecency/sdk");
  return {
    ...actual,
    getDiscussionsQueryOptions: vi.fn(() => ({
      queryKey: ["discussions"],
      queryFn: vi.fn().mockResolvedValue([]),
      enabled: true
    }))
  };
});

import { EntryPageDiscussionsWrapper } from
  "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-discussions-wrapper";

describe("EntryPageDiscussionsWrapper", () => {
  const entry = mockEntry({ children: 5, author: "testuser", permlink: "test-post" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a button for anonymous users when there are comments", () => {
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: null, username: null, account: null,
      isLoading: false, isPending: false
    } as ReturnType<typeof useActiveAccount>);

    renderWithQueryClient(
      <EntryPageDiscussionsWrapper entry={entry} category="test" />
    );

    // i18n mock returns key; the component passes { n: 5 } so button exists
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("returns nothing when entry has no comments and user is anonymous", () => {
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: null, username: null, account: null,
      isLoading: false, isPending: false
    } as ReturnType<typeof useActiveAccount>);

    const noComments = mockEntry({ children: 0 });
    renderWithQueryClient(
      <EntryPageDiscussionsWrapper entry={noComments} category="test" />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not show the button for logged-in users", () => {
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: { username: "loggedin" }, username: "loggedin", account: null,
      isLoading: false, isPending: false
    } as ReturnType<typeof useActiveAccount>);

    renderWithQueryClient(
      <EntryPageDiscussionsWrapper entry={entry} category="test" />
    );

    // Logged-in users get Suspense/auto-load, not a manual button
    // The skeleton or discussions loader renders instead
    expect(screen.queryByText(/discussion\.reveal-comments/i)).not.toBeInTheDocument();
  });
});
