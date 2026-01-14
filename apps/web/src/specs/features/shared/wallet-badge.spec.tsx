import { vi } from 'vitest';
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient } from "@/specs/test-utils";
import { WalletBadge } from "@/features/shared/wallet-badge";
import { useActiveAccount } from "@/core/hooks";

vi.mock("@/core/hooks", () => ({
  useActiveAccount: vi.fn()
}));

vi.mock("@/utils", async () => {
  const actual = await vi.importActual("@/utils");
  return {
    ...actual,
    mockHiveWallet: vi.fn()
  };
});

vi.mock("@ui/svg", () => ({
  creditCardSvg: () => <svg data-testid="credit-card-icon" />
}));

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

describe("WalletBadge", () => {
  const mockAccount = {
    name: "testuser",
    balance: "100.000 HIVE",
    hbd_balance: "50.000 HBD",
    reward_hive_balance: "1.000 HIVE",
    reward_hbd_balance: "0.500 HBD",
    reward_vesting_balance: "100.000000 VESTS"
  };

  let mockmockHiveWallet: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { mockHiveWallet } = await import("@/utils");
    mockmockHiveWallet = mockHiveWallet as any;

    (useActiveAccount as any).mockReturnValue({
      username: "testuser",
      account: mockAccount
    });
  });

  test("renders wallet link with username", () => {
    mockmockHiveWallet.mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    renderWithQueryClient(<WalletBadge icon={null} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/@testuser/wallet");
  });

  test("renders default credit card icon when no icon provided", () => {
    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    renderWithQueryClient(<WalletBadge icon={null} />);

    expect(screen.getByTestId("credit-card-icon")).toBeInTheDocument();
  });

  test("renders custom icon when provided", () => {
    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const customIcon = <div data-testid="custom-icon">Custom</div>;

    renderWithQueryClient(<WalletBadge icon={customIcon} />);

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("credit-card-icon")).not.toBeInTheDocument();
  });

  test("shows reward badge when user has unclaimed rewards", () => {
    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: true
    }));

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).toBeInTheDocument();
  });

  test("does not show reward badge when user has no unclaimed rewards", () => {
    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).not.toBeInTheDocument();
  });

  test("displays unclaimed reward tooltip when rewards exist", () => {
    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: true
    }));

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const tooltipTrigger = container.querySelector(".user-wallet");
    expect(tooltipTrigger).toBeInTheDocument();
  });

  test("displays wallet tooltip when no rewards", () => {
    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const tooltipTrigger = container.querySelector(".user-wallet");
    expect(tooltipTrigger).toBeInTheDocument();
  });

  test("updates reward status when account changes", () => {
    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const { container, rerender } = renderWithQueryClient(<WalletBadge icon={null} />);

    let rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).not.toBeInTheDocument();

    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: true
    }));

    const updatedAccount = {
      ...mockAccount,
      reward_hive_balance: "10.000 HIVE"
    };

    (useActiveAccount as any).mockReturnValue({
      username: "testuser",
      account: updatedAccount
    });

    rerenderWithQueryClient(<WalletBadge icon={null} />);

    rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).toBeInTheDocument();
  });

  test("handles null account gracefully", () => {
    (useActiveAccount as any).mockReturnValue({
      username: "testuser",
      account: null
    });

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).not.toBeInTheDocument();
  });

  test("passes dynamic props to mockHiveWallet", () => {
    const mockDynamicProps = {
      base: 0.5,
      quote: 1.0
    };

    (useQuery as any).mockReturnValue({
      data: mockDynamicProps
    });

    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    renderWithQueryClient(<WalletBadge icon={null} />);

    expect(mockHiveWallet).toHaveBeenCalledWith(mockAccount, mockDynamicProps);
  });

  test("uses default dynamic props when query returns undefined", () => {
    (useQuery as any).mockReturnValue({
      data: undefined
    });

    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    renderWithQueryClient(<WalletBadge icon={null} />);

    expect(mockHiveWallet).toHaveBeenCalled();
  });

  test("applies user-wallet class to link", () => {
    (mockHiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const { container } = renderWithQueryClient(<WalletBadge icon={null} />);

    const walletLink = container.querySelector(".user-wallet");
    expect(walletLink).toBeInTheDocument();
  });
});
