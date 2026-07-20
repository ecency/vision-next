import { vi } from 'vitest';
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useBookmarkAdd, useBookmarkDelete } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { Entry } from "@/entities";
import { BookmarkBtn } from "../../../features/shared";

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: vi.fn()
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  isServer: false
}));

// Spread props so the transient animation className/onAnimationEnd wiring on
// the icon stays observable.
// Spread the real module so unrelated icons pulled in transitively keep resolving;
// only the two this spec asserts on are stubbed.
vi.mock("@tooni/iconscout-unicons-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tooni/iconscout-unicons-react")>()),
  UilBookmark: (props: any) => <svg data-testid="bookmark-icon" {...props} />,
  UilBell: () => <svg data-testid="bell-icon" />
}));

describe("BookmarkBtn", () => {
  const entry: Entry = {
    author: "author1",
    permlink: "permlink1"
    // Add other required fields for Entry
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders login required when no active user", () => {
    useActiveAccount.mockReturnValue({ activeUser: null, username: null });
    (useQuery as any).mockReturnValue({ data: [] });
    useBookmarkAdd.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useBookmarkDelete.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    expect(screen.getByTitle("bookmark-btn.add")).toBeInTheDocument();
  });

  test("renders add bookmark button for non-bookmarked entry", () => {
    useActiveAccount.mockReturnValue({ activeUser: { username: "user1" }, username: "user1" });
    (useQuery as any).mockReturnValue({ data: [] });
    useBookmarkAdd.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useBookmarkDelete.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    expect(screen.getByTitle("bookmark-btn.add")).toBeInTheDocument();
  });

  test("calls addBookmark when button is clicked", () => {
    const addBookmarkMock = vi.fn();
    useActiveAccount.mockReturnValue({ activeUser: { username: "user1" }, username: "user1" });
    (useQuery as any).mockReturnValue({ data: [] });
    useBookmarkAdd.mockReturnValue({ mutateAsync: addBookmarkMock, isPending: false });
    useBookmarkDelete.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    fireEvent.click(screen.getByRole("button"));

    expect(addBookmarkMock).toHaveBeenCalled();
  });

  test("renders delete bookmark button for bookmarked entry", () => {
    const bookmarkId = "bookmark123";
    useActiveAccount.mockReturnValue({ activeUser: { username: "user1" }, username: "user1" });
    (useQuery as any).mockReturnValue({
      data: [{ _id: bookmarkId, author: entry.author, permlink: entry.permlink }]
    });
    useBookmarkDelete.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    expect(screen.getByTitle("bookmark-btn.delete")).toBeInTheDocument();
  });

  test("calls deleteBookmark when button is clicked", () => {
    const deleteBookmarkMock = vi.fn();
    const bookmarkId = "bookmark123";
    useActiveAccount.mockReturnValue({ activeUser: { username: "user1" }, username: "user1" });
    (useQuery as any).mockReturnValue({
      data: [{ _id: bookmarkId, author: entry.author, permlink: entry.permlink }]
    });
    useBookmarkAdd.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useBookmarkDelete.mockReturnValue({
      mutateAsync: deleteBookmarkMock,
      isPending: false
    });

    render(<BookmarkBtn entry={entry} />);

    fireEvent.click(screen.getByRole("button"));

    expect(deleteBookmarkMock).toHaveBeenCalled();
  });

  test("pulses the icon after a successful bookmark add and clears on animationend", async () => {
    useActiveAccount.mockReturnValue({ activeUser: { username: "user1" }, username: "user1" });
    (useQuery as any).mockReturnValue({ data: [] });
    // Invoke the component-supplied success callback on mutate, like the real hook.
    useBookmarkAdd.mockImplementation((_u: any, _t: any, onSuccess: any) => ({
      mutateAsync: vi.fn(async () => onSuccess()),
      isPending: false
    }));
    useBookmarkDelete.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    // Transient class: never present on initial render.
    expect(screen.getByTestId("bookmark-icon")).not.toHaveClass("animate-success-pulse");

    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByTestId("bookmark-icon")).toHaveClass("animate-success-pulse")
    );

    fireEvent.animationEnd(screen.getByTestId("bookmark-icon"));
    expect(screen.getByTestId("bookmark-icon")).not.toHaveClass("animate-success-pulse");
  });

  test("does not pulse the icon for an already-bookmarked entry on initial render", () => {
    useActiveAccount.mockReturnValue({ activeUser: { username: "user1" }, username: "user1" });
    (useQuery as any).mockReturnValue({
      data: [{ _id: "bookmark123", author: entry.author, permlink: entry.permlink }]
    });
    useBookmarkAdd.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useBookmarkDelete.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    expect(screen.getByTestId("bookmark-icon")).not.toHaveClass("animate-success-pulse");
  });
});
