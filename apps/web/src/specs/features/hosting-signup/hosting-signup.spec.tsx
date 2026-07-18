import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// One-click HBD pay: clicking "Pay with Hive" must broadcast the EXACT payment instructions
// (to / amount / memo) through the user's transfer mutation, then poll the tenant and advance to
// success once it is active. i18next is globally mocked to echo keys, so we match on key strings.

// Hoisted so the vi.mock factories (which run before top-level consts initialize) can reference them.
const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  authLoginType: "keychain" as string,
  hostingApi: {
    paymentMethods: vi.fn(),
    createTenant: vi.fn(),
    paymentInstructions: vi.fn(),
    tenant: vi.fn(),
    tenantsByOwner: vi.fn()
  }
}));
const { mutateAsync, hostingApi } = mocks;

vi.mock("@/api/sdk-mutations", () => ({
  useTransferMutation: () => ({ mutateAsync: mocks.mutateAsync })
}));

vi.mock("@/features/hosting-signup/hosting-api", async () => {
  const actual = await vi.importActual<any>("@/features/hosting-signup/hosting-api");
  return { ...actual, hostingApi: mocks.hostingApi };
});

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: () => ({ activeUser: { username: "alice" } })
}));

// getLoginType drives whether the in-page one-click button is offered: Keychain-family extensions
// sign in-page, while HiveSigner/keychain-mobile redirect and must fall back to manual.
vi.mock("@/utils/user-token", () => ({
  getLoginType: () => mocks.authLoginType
}));

vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: (s: any) => unknown) => selector({ toggleUiProp: vi.fn() })
}));

import { HostingSignup } from "@/features/hosting-signup/hosting-signup";

const INSTRUCTIONS = { to: "ecency.hosting", amount: "2.000 HBD", memo: "blog:alice" };

describe("HostingSignup one-click HBD pay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authLoginType = "keychain";
    // Card disabled so the payment step defaults to the HBD rail (where the one-click lives).
    hostingApi.paymentMethods.mockResolvedValue({
      hbd: { enabled: true, monthly: "2.000", account: "ecency.hosting" },
      x402: { enabled: false, monthly: "2.000" },
      card: { enabled: false, monthlyUsdCents: 200 }
    });
    hostingApi.createTenant.mockResolvedValue({
      tenant: {
        username: "alice",
        subscriptionStatus: "inactive",
        blogUrl: "https://alice.blogs.ecency.com"
      }
    });
    hostingApi.paymentInstructions.mockResolvedValue(INSTRUCTIONS);
    // First activation: no baseline expiry, so "active" alone confirms.
    hostingApi.tenant.mockResolvedValue({
      username: "alice",
      owner: "alice",
      subscriptionStatus: "active",
      subscriptionExpiresAt: "2026-08-16T00:00:00.000Z"
    });
    mutateAsync.mockResolvedValue({ id: "tx1" });
  });

  it("broadcasts the exact transfer and advances to success", async () => {
    render(<HostingSignup />);

    // Username step (username pre-filled with the active account) -> configure -> payment.
    fireEvent.click(screen.getByText("g.continue"));
    fireEvent.click(await screen.findByText("g.continue")); // configure step's Continue

    // The one-click button appears once payment instructions load and enable it.
    const payBtn = (await screen.findByRole("button", {
      name: "hosting.pay-hbd-oneclick"
    })) as HTMLButtonElement;
    await waitFor(() => expect(payBtn.disabled).toBe(false));

    fireEvent.click(payBtn);

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        to: INSTRUCTIONS.to,
        amount: INSTRUCTIONS.amount,
        memo: INSTRUCTIONS.memo
      })
    );
    // Poll saw an active tenant -> success screen (findByText throws if absent).
    await screen.findByText("hosting.success-title");
  });

  it("does not broadcast until the user clicks pay (no accidental transfer)", async () => {
    render(<HostingSignup />);
    fireEvent.click(screen.getByText("g.continue"));
    fireEvent.click(await screen.findByText("g.continue"));
    await screen.findByText("hosting.pay-hbd-oneclick");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("falls back to manual (no one-click) for a redirecting login like HiveSigner", async () => {
    mocks.authLoginType = "hivesigner";
    render(<HostingSignup />);
    fireEvent.click(screen.getByText("g.continue"));
    fireEvent.click(await screen.findByText("g.continue"));
    // Manual path is shown; the in-page one-click button is not offered (it would be abandoned by
    // the HiveSigner page redirect mid-transfer).
    await screen.findByText("hosting.ive-paid");
    expect(screen.queryByText("hosting.pay-hbd-oneclick")).toBeNull();
  });
});
