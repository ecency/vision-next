import { vi } from 'vitest';
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient } from "@/specs/test-utils";
import { WalletBadge } from "@/features/shared/wallet-badge";
import { useActiveAccount } from "@/core/hooks";
import { useQuery } from "@tanstack/react-query";

vi.mock("@/core/hooks", () => ({
  useActiveAccount: vi.fn()
}));

// Global mock state (must be defined before vi.mock)
let mockHasUnclaimedRewards = false;

vi.mock("@/utils", async () => {
  const actual = await vi.importActual("@/utils");

  // Define MockHiveWallet inside the factory
  class MockHiveWallet {
    hasUnclaimedRewards: boolean;

    constructor(account: any, dynamicProps: any) {
      // Access the global variable
      this.hasUnclaimedRewards = (globalThis as any).__mockHasUnclaimedRewards || false;
    }
  }

  return {
    ...actual,
    HiveWallet: MockHiveWallet
  };
});

vi.mock("@ui/svg", async () => {
  const actual = await vi.importActual("@ui/svg");
  return {
    ...actual,
    creditCardSvg: <svg data-testid="credit-card-icon" />
  };
});

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual("@ecency/sdk");
  return {
    ...actual,
    getDynamicPropsQueryOptions: vi.fn(() => ({
      queryKey: ['dynamic-props'],
      queryFn: vi.fn()
    }))
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn()
  };
});

describe("WalletBadge", () => {
  const mockAccount = {
    name: "testuser",
    balance: "100.000 HIVE",
    hbd_balance: "50.000 HBD",
    reward_hive_balance: "1.000 HIVE",
    reward_hbd_balance: "0.500 HBD",
    reward_vesting_balance: "100.000000 VESTS"
  };

  // Helper to set mock value
  const setMockHasUnclaimedRewards = (value: boolean) => {
    (globalThis as any).__mockHasUnclaimedRewards = value;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setMockHasUnclaimedRewards(false); // Reset to default

    (useActiveAccount as any).mockReturnValue({
      username: "testuser",
      account: mockAccount
    });

    // Default useQuery mock returns undefined (will use DEFAULT_DYNAMIC_PROPS)
    (useQuery as any).mockReturnValue({
      data: undefined
    });
  });

  test("renders wallet link with username", () => {
    setMockHasUnclaimedRewards(false);

    renderWithQueryClient(<WalletBadge icon={null} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/@testuser/wallet");
  });

  test("renders default credit card icon when no icon provided", () => {
    setMockHasUnclaimedRewards(false);

    renderWithQueryClient(<WalletBadge icon={null} />);

    expect(screen.getByTestId("credit-card-icon")).toBeInTheDocument();
  });

  test("renders custom icon when provided", () => {
    setMockHasUnclaimedRewards(false);

    const customIcon = <div data-testid="custom-icon">Custom</div>;

    renderWithQueryClient(<WalletBadge icon={customIcon} />);

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("credit-card-icon")).not.toBeInTheDocument();
  });

  test("shows reward badge when user has unclaimed rewards", () => {
    setMockHasUnclaimedRewards(true);

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).toBeInTheDocument();
  });

  test("does not show reward badge when user has no unclaimed rewards", () => {
    setMockHasUnclaimedRewards(false);

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).not.toBeInTheDocument();
  });

  test("displays unclaimed reward tooltip when rewards exist", () => {
    setMockHasUnclaimedRewards(true);

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const tooltipTrigger = container.querySelector(".user-wallet");
    expect(tooltipTrigger).toBeInTheDocument();
  });

  test("displays wallet tooltip when no rewards", () => {
    setMockHasUnclaimedRewards(false);

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const tooltipTrigger = container.querySelector(".user-wallet");
    expect(tooltipTrigger).toBeInTheDocument();
  });

  test("updates reward status when account changes", () => {
    setMockHasUnclaimedRewards(false);

    const { container, rerender } = renderWithQueryClient(<WalletBadge icon={null} />);

    let rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).not.toBeInTheDocument();

    // Update mock to return true for unclaimed rewards
    setMockHasUnclaimedRewards(true);

    const updatedAccount = {
      ...mockAccount,
      reward_hive_balance: "10.000 HIVE"
    };

    (useActiveAccount as any).mockReturnValue({
      username: "testuser",
      account: updatedAccount
    });

    rerender(<WalletBadge icon={null} />);

    rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).toBeInTheDocument();
  });

  test("handles null account gracefully", () => {
    setMockHasUnclaimedRewards(false);

    (useActiveAccount as any).mockReturnValue({
      username: "testuser",
      account: null
    });

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).not.toBeInTheDocument();
  });

  test("passes dynamic props to HiveWallet", () => {
    setMockHasUnclaimedRewards(false);

    const mockDynamicProps = {
      base: 0.5,
      quote: 1.0
    };

    (useQuery as any).mockReturnValue({
      data: mockDynamicProps
    });

    renderWithQueryClient(<WalletBadge icon={null} />);

    // Component should render without errors when dynamic props are provided
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/@testuser/wallet");
  });

  test("uses default dynamic props when query returns undefined", () => {
    setMockHasUnclaimedRewards(false);

    (useQuery as any).mockReturnValue({
      data: undefined
    });

    renderWithQueryClient(<WalletBadge icon={null} />);

    // Component should render without errors when using default dynamic props
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/@testuser/wallet");
  });

  test("applies user-wallet class to link", () => {
    setMockHasUnclaimedRewards(false);

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const walletLink = container.querySelector(".user-wallet");
    expect(walletLink).toBeInTheDocument();
  });
});
