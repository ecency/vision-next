import { vi, describe, test, expect, beforeEach } from "vitest";
import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAccountFavoriteDelete } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";
import { renderWithQueryClient } from "@/specs/test-utils";
import { FavoriteItem } from "@/features/shared/bookmarks/favorite-item";

const mockMutateAsync = vi.fn();

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual("@ecency/sdk");
  return {
    ...actual,
    useAccountFavoriteDelete: vi.fn(() => ({
      mutateAsync: mockMutateAsync,
      isPending: false
    })),
    getAccountFullQueryOptions: vi.fn(() => ({
      queryKey: ["account", "full"],
      queryFn: vi.fn()
    }))
  };
});

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}));

const mockItem = {
  _id: "fav-1",
  account: "testauthor",
  timestamp: Date.now()
};

describe("FavoriteItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: { username: "testuser" } as any,
      username: "testuser",
      account: null,
      isLoading: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      error: null,
      refetch: vi.fn()
    });
    vi.mocked(getAccessToken).mockReturnValue("test-access-token");
  });

  test("passes accessToken to useAccountFavoriteDelete", () => {
    renderWithQueryClient(
      <FavoriteItem item={mockItem} onHide={vi.fn()} i={0} />
    );

    expect(useAccountFavoriteDelete).toHaveBeenCalledWith(
      "testuser",
      "test-access-token",
      expect.any(Function),
      expect.any(Function)
    );
  });

  test("calls removeFromFavorites with account name on delete click", () => {
    renderWithQueryClient(
      <FavoriteItem item={mockItem} onHide={vi.fn()} i={0} />
    );

    const deleteButton = screen.getByRole("button");
    fireEvent.click(deleteButton);

    expect(mockMutateAsync).toHaveBeenCalledWith("testauthor");
  });
});
