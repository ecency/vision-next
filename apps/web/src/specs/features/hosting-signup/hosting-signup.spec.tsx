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
    sessionStorage.clear();
    window.history.replaceState(null, "", "/"); // clear any ?resume= from a prior test
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

  it("resumes to payment from a ?resume= deep-link only for an owned, pending reservation", async () => {
    hostingApi.tenantsByOwner.mockResolvedValue({
      tenants: [{ username: "alice", type: "blog", subscriptionStatus: "inactive", owner: "alice" }]
    });
    window.history.replaceState(null, "", "/hosting?resume=alice");
    render(<HostingSignup />);
    // Verified against the owned list, then resumes the reservation at payment (createTenant
    // refreshes it), and the resume param is consumed from the URL.
    await waitFor(() =>
      expect(hostingApi.createTenant).toHaveBeenCalledWith("alice", "alice", expect.anything())
    );
    await screen.findByRole("button", { name: "hosting.pay-hbd-oneclick" });
    expect(window.location.search).toBe("");
  });

  it("ignores a ?resume= for a name the user does not own (no reservation created)", async () => {
    hostingApi.tenantsByOwner.mockResolvedValue({ tenants: [] }); // alice owns nothing matching
    window.history.replaceState(null, "", "/hosting?resume=victim");
    render(<HostingSignup />);
    // Give the async owned-tenants check time to resolve, then assert no tenant was created and we
    // stayed on the first step.
    await waitFor(() => expect(hostingApi.tenantsByOwner).toHaveBeenCalled());
    expect(hostingApi.createTenant).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "hosting.pay-hbd-oneclick" })).toBeNull();
  });

  it("fetches custom-domain (:domain) HBD instructions when the add-on is toggled", async () => {
    render(<HostingSignup />);
    fireEvent.click(screen.getByText("g.continue"));
    fireEvent.click(await screen.findByText("g.continue"));
    // Standard HBD instructions are fetched first (domain = false).
    await waitFor(() =>
      expect(hostingApi.paymentInstructions).toHaveBeenCalledWith("alice", 1, false)
    );
    // Toggle the custom-domain add-on -> instructions are re-fetched with domain = true so the
    // memo/price reflect the one-step :domain tier on the HBD rail (no steer to card).
    fireEvent.click(await screen.findByText("hosting.custom-domain-option"));
    await waitFor(() =>
      expect(hostingApi.paymentInstructions).toHaveBeenCalledWith("alice", 1, true)
    );
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

  it("resumes a pending payment left by a redirect and shows success once active", async () => {
    // A redirecting signer (or reload) left a marker; on mount we poll and confirm activation.
    sessionStorage.setItem(
      "ecency:hosting:pending-hbd",
      JSON.stringify({ tenant: "alice", blogUrl: "https://alice.blogs.ecency.com", baseline: null })
    );
    render(<HostingSignup />);
    await screen.findByText("hosting.success-title");
    // Marker is cleared after a successful resume.
    expect(sessionStorage.getItem("ecency:hosting:pending-hbd")).toBeNull();
  });

  it("locks the one-click button after a broadcast whose activation times out (no duplicate send)", async () => {
    hostingApi.tenant.mockResolvedValue({
      username: "alice",
      owner: "alice",
      subscriptionStatus: "inactive",
      subscriptionExpiresAt: null
    });
    render(<HostingSignup />);
    fireEvent.click(screen.getByText("g.continue"));
    fireEvent.click(await screen.findByText("g.continue"));
    const payBtn = (await screen.findByRole("button", {
      name: "hosting.pay-hbd-oneclick"
    })) as HTMLButtonElement;
    await waitFor(() => expect(payBtn.disabled).toBe(false));

    vi.useFakeTimers();
    fireEvent.click(payBtn);
    // Broadcast resolves, then pollActivation loops 15×3s and times out.
    await vi.advanceTimersByTimeAsync(15 * 3000 + 200);
    vi.useRealTimers();

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    // paying stays true -> button remains disabled so the same transfer can't be sent again.
    expect(payBtn.disabled).toBe(true);
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
