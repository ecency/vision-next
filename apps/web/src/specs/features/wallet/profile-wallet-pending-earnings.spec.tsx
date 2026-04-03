import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient } from "@/specs/test-utils";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQuery } from "@tanstack/react-query";

vi.mock("@/utils", async () => {
  const actual = await vi.importActual("@/utils");
  return { ...actual as any };
});

vi.mock("@/core/hooks/use-active-account");
vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ username: "testuser" })),
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() }))
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn()
    }))
  };
});

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual("@ecency/sdk");
  return {
    ...actual,
    useClaimPoints: vi.fn(() => ({ mutateAsync: vi.fn() }))
  };
});

vi.mock("@/api/sdk-mutations", () => ({
  useClaimRewardsMutation: vi.fn(() => ({ mutateAsync: vi.fn() }))
}));

vi.mock("@/features/wallet/utils/invalidate-wallet-queries", () => ({
  invalidateWalletQueries: vi.fn()
}));

import { ProfileWalletPendingEarnings } from "@/app/(dynamicPages)/profile/[username]/wallet/_components/profile-wallet-pending-earnings";

describe("ProfileWalletPendingEarnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: { username: "testuser" }, username: "testuser", account: null,
      isLoading: false, isPending: false
    } as ReturnType<typeof useActiveAccount>);
  });

  it("returns null when there are no rewards or earnings", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined, isPending: false, isLoading: false
    } as any);

    renderWithQueryClient(<ProfileWalletPendingEarnings />);
    // i18n returns keys: "wallet.claimable-label", "wallet.potential-label"
    expect(screen.queryByText(/wallet\.claimable-label/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/wallet\.potential-label/i)).not.toBeInTheDocument();
  });

  it("shows claimable section when there are unclaimed rewards", () => {
    let callIndex = 0;
    vi.mocked(useQuery).mockImplementation(() => {
      const idx = callIndex++;
      if (idx === 0) return { data: { reward_hive_balance: "1.000 HIVE", reward_hbd_balance: "2.000 HBD", reward_vesting_balance: "100.000000 VESTS" }, isPending: false } as any;
      if (idx === 1) return { data: { hivePerMVests: 500, base: 0.5, quote: 1 }, isPending: false } as any;
      if (idx === 2) return { data: { uPoints: "5.0" }, isPending: false } as any;
      return { data: [], isPending: false } as any;
    });

    renderWithQueryClient(<ProfileWalletPendingEarnings />);
    // i18n returns key as text
    expect(screen.getByText(/wallet\.claimable-label/i)).toBeInTheDocument();
  });

  it("shows pending earnings when there are active posts", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    let callIndex = 0;
    vi.mocked(useQuery).mockImplementation(() => {
      const idx = callIndex++;
      if (idx === 0) return { data: { reward_hive_balance: "0.000 HIVE", reward_hbd_balance: "0.000 HBD", reward_vesting_balance: "0.000000 VESTS" }, isPending: false } as any;
      if (idx === 1) return { data: { hivePerMVests: 500, base: 0.5, quote: 1 }, isPending: false } as any;
      if (idx === 2) return { data: { uPoints: "0" }, isPending: false } as any;
      if (idx === 3) return { data: [{ payout_at: futureDate, pending_payout_value: "10.000 HBD" }], isPending: false } as any;
      return { data: [], isPending: false } as any;
    });

    renderWithQueryClient(<ProfileWalletPendingEarnings />);
    expect(screen.getByText(/wallet\.potential-label/i)).toBeInTheDocument();
  });
});
