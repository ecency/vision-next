import { vi } from 'vitest';
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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

vi.mock("@tooni/iconscout-unicons-react", () => ({
  UilBookmark: () => <svg data-testid="bookmark-icon" />
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
});
