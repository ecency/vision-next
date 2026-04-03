import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient } from "@/specs/test-utils";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQuery } from "@tanstack/react-query";

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
    getAccountFullQueryOptions: vi.fn(() => ({ queryKey: ["account"], queryFn: vi.fn() })),
    getPointsQueryOptions: vi.fn(() => ({ queryKey: ["points"], queryFn: vi.fn() })),
    getDynamicPropsQueryOptions: vi.fn(() => ({ queryKey: ["dynamic-props"], queryFn: vi.fn() })),
    getAccountPostsQueryOptions: vi.fn(() => ({ queryKey: ["posts"], queryFn: vi.fn() })),
    useClaimPoints: vi.fn(() => ({ mutateAsync: vi.fn() }))
  };
});

vi.mock("@/api/sdk-mutations", () => ({
  useClaimRewardsMutation: vi.fn(() => ({ mutateAsync: vi.fn() }))
}));

import { ProfileWalletPendingEarnings } from "@/app/(dynamicPages)/profile/[username]/wallet/_components/profile-wallet-pending-earnings";

describe("ProfileWalletPendingEarnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: { username: "testuser" },
      username: "testuser",
      account: null,
      isLoading: false,
      isPending: false
    } as any);
  });

  it("returns null when there are no rewards or earnings", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isPending: false,
      isLoading: false
    } as any);

    const { container } = renderWithQueryClient(<ProfileWalletPendingEarnings />);
    expect(container.innerHTML).toBe("");
  });

  it("shows ready to collect when there are unclaimed rewards", () => {
    const mockAccount = {
      reward_hive_balance: "1.000 HIVE",
      reward_hbd_balance: "2.000 HBD",
      reward_vesting_balance: "100.000000 VESTS"
    };

    vi.mocked(useQuery).mockImplementation((opts: any) => {
      const key = opts?.queryKey?.[0];
      if (key === "account") return { data: mockAccount, isPending: false } as any;
      if (key === "dynamic-props") return { data: { hivePerMVests: 500, base: 0.5, quote: 1 }, isPending: false } as any;
      if (key === "points") return { data: { uPoints: "5.0" }, isPending: false } as any;
      return { data: [], isPending: false } as any;
    });

    renderWithQueryClient(<ProfileWalletPendingEarnings />);
    expect(screen.getByText(/Ready to collect/i)).toBeInTheDocument();
  });

  it("shows pending earnings when there are active posts", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    vi.mocked(useQuery).mockImplementation((opts: any) => {
      const key = opts?.queryKey?.[0];
      if (key === "account") return { data: { reward_hive_balance: "0.000 HIVE", reward_hbd_balance: "0.000 HBD", reward_vesting_balance: "0.000000 VESTS" }, isPending: false } as any;
      if (key === "dynamic-props") return { data: { hivePerMVests: 500, base: 0.5, quote: 1 }, isPending: false } as any;
      if (key === "points") return { data: { uPoints: "0" }, isPending: false } as any;
      if (key === "posts") return { data: [{ payout_at: futureDate, pending_payout_value: "10.000 HBD" }], isPending: false } as any;
      return { data: [], isPending: false } as any;
    });

    renderWithQueryClient(<ProfileWalletPendingEarnings />);
    expect(screen.getByText(/Pending earnings/i)).toBeInTheDocument();
    expect(screen.getByText(/from active posts and comments/i)).toBeInTheDocument();
  });
});
