import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useClientActiveUser } from "@/api/queries";
import { useBookmarkAdd, useBookmarkDelete } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { Entry } from "@/entities";
import { BookmarkBtn } from "../../../features/shared";

jest.mock("@/api/queries", () => ({
  useClientActiveUser: jest.fn()
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn()
}));

jest.mock("@tooni/iconscout-unicons-react", () => ({
  UilBookmark: () => <svg data-testid="bookmark-icon" />
}));

describe("BookmarkBtn", () => {
  const entry: Entry = {
    author: "author1",
    permlink: "permlink1"
    // Add other required fields for Entry
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders login required when no active user", () => {
    useClientActiveUser.mockReturnValue(null);
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    useBookmarkAdd.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    useBookmarkDelete.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    expect(screen.getByTitle("bookmark-btn.add")).toBeInTheDocument();
  });

  test("renders add bookmark button for non-bookmarked entry", () => {
    useClientActiveUser.mockReturnValue({ username: "user1" });
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    useBookmarkAdd.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    useBookmarkDelete.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    expect(screen.getByTitle("bookmark-btn.add")).toBeInTheDocument();
  });

  test("calls addBookmark when button is clicked", () => {
    const addBookmarkMock = jest.fn();
    useClientActiveUser.mockReturnValue({ username: "user1" });
    (useQuery as jest.Mock).mockReturnValue({ data: [] });
    useBookmarkAdd.mockReturnValue({ mutateAsync: addBookmarkMock, isPending: false });
    useBookmarkDelete.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    fireEvent.click(screen.getByRole("button"));

    expect(addBookmarkMock).toHaveBeenCalled();
  });

  test("renders delete bookmark button for bookmarked entry", () => {
    const bookmarkId = "bookmark123";
    useClientActiveUser.mockReturnValue({ username: "user1" });
    (useQuery as jest.Mock).mockReturnValue({
      data: [{ _id: bookmarkId, author: entry.author, permlink: entry.permlink }]
    });
    useBookmarkDelete.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });

    render(<BookmarkBtn entry={entry} />);

    expect(screen.getByTitle("bookmark-btn.delete")).toBeInTheDocument();
  });

  test("calls deleteBookmark when button is clicked", () => {
    const deleteBookmarkMock = jest.fn();
    const bookmarkId = "bookmark123";
    useClientActiveUser.mockReturnValue({ username: "user1" });
    (useQuery as jest.Mock).mockReturnValue({
      data: [{ _id: bookmarkId, author: entry.author, permlink: entry.permlink }]
    });
    useBookmarkAdd.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    useBookmarkDelete.mockReturnValue({
      mutateAsync: deleteBookmarkMock,
      isPending: false
    });

    render(<BookmarkBtn entry={entry} />);

    fireEvent.click(screen.getByRole("button"));

    expect(deleteBookmarkMock).toHaveBeenCalled();
  });
});
