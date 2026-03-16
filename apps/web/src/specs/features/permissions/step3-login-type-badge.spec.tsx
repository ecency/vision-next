import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQuery } from "@tanstack/react-query";

vi.mock("@/core/hooks/use-active-account");
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn()
}));
vi.mock("@/utils/user-token", () => ({
  getLoginType: vi.fn()
}));
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));

import { getLoginType } from "@/utils/user-token";
import { Step3ReviewKeys } from "@/app/(dynamicPages)/profile/[username]/permissions/_components/add-keys-steps/step-3-review-keys";

const mockAccountData = {
  owner: [["STM_OWNER_KEY", 1]],
  active: [["STM_ACTIVE_KEY", 1]],
  posting: [["STM_POSTING_KEY", 1]],
  memo: [["STM_MEMO_KEY", 1]]
};

describe("Step3ReviewKeys - login type badges", () => {
  beforeEach(() => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "testuser" }
    });
    (useQuery as any).mockReturnValue({ data: mockAccountData });
  });

  it("shows MetaMask badge for MetaMask users", () => {
    (getLoginType as any).mockReturnValue("metamask");
    render(<Step3ReviewKeys onNext={vi.fn()} onBack={vi.fn()} />);
    const badges = screen.getAllByText("MetaMask");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows Keychain badge for Keychain users", () => {
    (getLoginType as any).mockReturnValue("keychain");
    render(<Step3ReviewKeys onNext={vi.fn()} onBack={vi.fn()} />);
    const badges = screen.getAllByText("Keychain");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows HiveSigner badge for HiveSigner users", () => {
    (getLoginType as any).mockReturnValue("hivesigner");
    render(<Step3ReviewKeys onNext={vi.fn()} onBack={vi.fn()} />);
    const badges = screen.getAllByText("HiveSigner");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows Private Key badge for privateKey users", () => {
    (getLoginType as any).mockReturnValue("privateKey");
    render(<Step3ReviewKeys onNext={vi.fn()} onBack={vi.fn()} />);
    const badges = screen.getAllByText("permissions.add-keys.step3.derivation-private-key");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("disables checkboxes when only one key per authority", () => {
    (getLoginType as any).mockReturnValue("keychain");
    render(<Step3ReviewKeys onNext={vi.fn()} onBack={vi.fn()} />);

    // All checkboxes should be disabled since there's only 1 key per authority
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => {
      expect(cb).toBeDisabled();
    });
  });
});
