import { vi } from 'vitest';
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { WalletBadge } from "@/features/shared/wallet-badge";
import { useActiveAccount } from "@/core/hooks";
import { useQuery } from "@tanstack/react-query";
import { HiveWallet } from "@/utils";

vi.mock("@/core/hooks", () => ({
  useActiveAccount: vi.fn()
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn()
}));

vi.mock("@/utils", () => ({
  HiveWallet: vi.fn()
}));

vi.mock("@ui/svg", () => ({
  creditCardSvg: <svg data-testid="credit-card-icon" />
}));

vi.mock("i18next", () => ({
  default: {
    t: (key: string) => key
  }
}));

describe("WalletBadge", () => {
  const mockAccount = {
    name: "testuser",
    balance: "100.000 HIVE",
    hbd_balance: "50.000 HBD",
    reward_hive_balance: "1.000 HIVE",
    reward_hbd_balance: "0.500 HBD",
    reward_vesting_balance: "100.000000 VESTS"
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useActiveAccount as any).mockReturnValue({
      username: "testuser",
      account: mockAccount
    });

    (useQuery as any).mockReturnValue({
      data: {
        base: 0.5,
        quote: 1.0
      }
    });
  });

  test("renders wallet link with username", () => {
    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    render(<WalletBadge icon={null} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/@testuser/wallet");
  });

  test("renders default credit card icon when no icon provided", () => {
    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    render(<WalletBadge icon={null} />);

    expect(screen.getByTestId("credit-card-icon")).toBeInTheDocument();
  });

  test("renders custom icon when provided", () => {
    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const customIcon = <div data-testid="custom-icon">Custom</div>;

    render(<WalletBadge icon={customIcon} />);

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("credit-card-icon")).not.toBeInTheDocument();
  });

  test("shows reward badge when user has unclaimed rewards", () => {
    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: true
    }));

    const { container } = render(<WalletBadge icon={null} />);

    const rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).toBeInTheDocument();
  });

  test("does not show reward badge when user has no unclaimed rewards", () => {
    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const { container } = render(<WalletBadge icon={null} />);

    const rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).not.toBeInTheDocument();
  });

  test("displays unclaimed reward tooltip when rewards exist", () => {
    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: true
    }));

    const { container } = render(<WalletBadge icon={null} />);

    const tooltipTrigger = container.querySelector(".user-wallet");
    expect(tooltipTrigger).toBeInTheDocument();
  });

  test("displays wallet tooltip when no rewards", () => {
    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const { container } = render(<WalletBadge icon={null} />);

    const tooltipTrigger = container.querySelector(".user-wallet");
    expect(tooltipTrigger).toBeInTheDocument();
  });

  test("updates reward status when account changes", () => {
    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const { container, rerender } = render(<WalletBadge icon={null} />);

    let rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).not.toBeInTheDocument();

    (HiveWallet as any).mockImplementation(() => ({
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

    rerender(<WalletBadge icon={null} />);

    rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).toBeInTheDocument();
  });

  test("handles null account gracefully", () => {
    (useActiveAccount as any).mockReturnValue({
      username: "testuser",
      account: null
    });

    const { container } = render(<WalletBadge icon={null} />);

    const rewardBadge = container.querySelector(".reward-badge");
    expect(rewardBadge).not.toBeInTheDocument();
  });

  test("passes dynamic props to HiveWallet", () => {
    const mockDynamicProps = {
      base: 0.5,
      quote: 1.0
    };

    (useQuery as any).mockReturnValue({
      data: mockDynamicProps
    });

    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    render(<WalletBadge icon={null} />);

    expect(HiveWallet).toHaveBeenCalledWith(mockAccount, mockDynamicProps);
  });

  test("uses default dynamic props when query returns undefined", () => {
    (useQuery as any).mockReturnValue({
      data: undefined
    });

    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    render(<WalletBadge icon={null} />);

    expect(HiveWallet).toHaveBeenCalled();
  });

  test("applies user-wallet class to link", () => {
    (HiveWallet as any).mockImplementation(() => ({
      hasUnclaimedRewards: false
    }));

    const { container } = render(<WalletBadge icon={null} />);

    const walletLink = container.querySelector(".user-wallet");
    expect(walletLink).toBeInTheDocument();
  });
});
