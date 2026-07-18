import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// The prorated custom-domain upgrade: fetch the quote, then a one-click `upgrade:<name>` HBD
// transfer of the quoted amount, polling until the tenant reports the Pro plan. i18next is echoed.
const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  authLoginType: "keychain" as string,
  hostingApi: { upgradeQuote: vi.fn(), tenant: vi.fn() }
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
vi.mock("@/utils/user-token", () => ({ getLoginType: () => mocks.authLoginType }));

import { CustomDomainUpgrade } from "@/features/hosting-signup/custom-domain-upgrade";

const QUOTE = {
  eligible: true,
  to: "ecency.hosting",
  amount: "5.000 HBD",
  memo: "upgrade:alice",
  remainingMonths: 5,
  perMonth: "1.000 HBD",
  expiresAt: "2026-06-15T00:00:00.000Z"
};

describe("CustomDomainUpgrade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authLoginType = "keychain";
    hostingApi.upgradeQuote.mockResolvedValue(QUOTE);
    hostingApi.tenant.mockResolvedValue({ username: "alice", subscriptionPlan: "pro" });
    mutateAsync.mockResolvedValue({ id: "tx1" });
  });

  it("broadcasts the prorated upgrade: transfer and calls onUpgraded once Pro", async () => {
    const onUpgraded = vi.fn();
    render(<CustomDomainUpgrade tenant="alice" onUpgraded={onUpgraded} />);

    const payBtn = (await screen.findByRole("button", {
      name: "hosting.upgrade-domain-pay"
    })) as HTMLButtonElement;
    await waitFor(() => expect(payBtn.disabled).toBe(false));
    fireEvent.click(payBtn);

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        to: "ecency.hosting",
        amount: "5.000 HBD",
        memo: "upgrade:alice"
      })
    );
    await waitFor(() => expect(onUpgraded).toHaveBeenCalled());
  });

  it("re-checks the quote before paying and doesn't broadcast if no longer eligible", async () => {
    // Eligible when the panel opens, but the tenant becomes Pro before the click (e.g. a concurrent
    // upgrade). The re-fetch inside payWithHive must stop the broadcast.
    hostingApi.upgradeQuote
      .mockResolvedValueOnce(QUOTE)
      .mockResolvedValueOnce({ eligible: false, reason: "already_pro" });
    render(<CustomDomainUpgrade tenant="alice" onUpgraded={vi.fn()} />);
    const payBtn = await screen.findByRole("button", { name: "hosting.upgrade-domain-pay" });
    fireEvent.click(payBtn);
    await screen.findByText("hosting.upgrade-domain-unavailable");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("does not broadcast if the pre-pay re-check errors (fail closed)", async () => {
    hostingApi.upgradeQuote.mockResolvedValueOnce(QUOTE).mockRejectedValueOnce(new Error("network"));
    render(<CustomDomainUpgrade tenant="alice" onUpgraded={vi.fn()} />);
    const payBtn = await screen.findByRole("button", { name: "hosting.upgrade-domain-pay" });
    fireEvent.click(payBtn);
    await screen.findByText("hosting.status-check-failed");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("does not broadcast a changed amount; it re-displays and requires another click", async () => {
    // The term (and thus the prorated price) changed between the panel rendering and the click —
    // e.g. a concurrent renewal. The re-fetch returns a higher amount; we must NOT broadcast the
    // amount the user didn't see. Instead update the shown price and wait for a fresh confirmation.
    const onUpgraded = vi.fn();
    hostingApi.upgradeQuote
      .mockResolvedValueOnce(QUOTE)
      .mockResolvedValueOnce({ ...QUOTE, amount: "6.000 HBD", remainingMonths: 6 });
    render(<CustomDomainUpgrade tenant="alice" onUpgraded={onUpgraded} />);
    const payBtn = await screen.findByRole("button", { name: "hosting.upgrade-domain-pay" });
    fireEvent.click(payBtn);

    // Notice shown, nothing broadcast on this click.
    await screen.findByText("hosting.upgrade-domain-amount-changed");
    expect(mutateAsync).not.toHaveBeenCalled();

    // A second click now confirms the updated amount and broadcasts exactly that.
    hostingApi.upgradeQuote.mockResolvedValue({ ...QUOTE, amount: "6.000 HBD", remainingMonths: 6 });
    fireEvent.click(await screen.findByRole("button", { name: "hosting.upgrade-domain-pay" }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        to: "ecency.hosting",
        amount: "6.000 HBD",
        memo: "upgrade:alice"
      })
    );
    await waitFor(() => expect(onUpgraded).toHaveBeenCalled());
  });

  it("shows unavailable when the tenant isn't eligible (already Pro / not active)", async () => {
    hostingApi.upgradeQuote.mockResolvedValue({ eligible: false, reason: "already_pro" });
    render(<CustomDomainUpgrade tenant="alice" onUpgraded={vi.fn()} />);
    await screen.findByText("hosting.upgrade-domain-unavailable");
    expect(screen.queryByRole("button", { name: "hosting.upgrade-domain-pay" })).toBeNull();
  });
});
