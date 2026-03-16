import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQuery, useQueryClient } from "@tanstack/react-query";

vi.mock("@/core/hooks/use-active-account");
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({ data: null })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  useMutation: vi.fn(() => ({ mutateAsync: vi.fn() }))
}));
vi.mock("@/utils/user-token", () => ({
  getLoginType: vi.fn(() => "keychain")
}));
vi.mock("@ecency/wallets", () => ({
  deriveHiveMasterPasswordKeys: vi.fn(() => ({
    owner: "5Jowner", active: "5Jactive", posting: "5Jposting", memo: "5Jmemo",
    ownerPubkey: "STMowner", activePubkey: "STMactive",
    postingPubkey: "STMposting", memoPubkey: "STMmemo"
  }))
}));
vi.mock("@/utils/master-password", () => ({
  generateMasterPassword: vi.fn(() => "P5TestMasterPasswordABC123")
}));
vi.mock("@/features/wallet", () => ({
  useDownloadKeys: vi.fn(() => vi.fn())
}));
vi.mock("react-use", () => ({
  useCopyToClipboard: vi.fn(() => [null, vi.fn()])
}));
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));
vi.mock("@/features/shared", () => ({
  success: vi.fn(),
  error: vi.fn(),
  KeyOrHot: ({ onKey, onKc }: any) => (
    <div>
      <button onClick={() => onKey?.("mock-key")}>Sign with Key</button>
      <button onClick={() => onKc?.()}>Sign with Keychain</button>
    </div>
  )
}));

import { ManageKeysAddKeys } from "@/app/(dynamicPages)/profile/[username]/permissions/_components/manage-keys-add-keys";

describe("ManageKeysAddKeys - 3-step flow", () => {
  beforeEach(() => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "testuser" }
    });
  });

  it("renders 3 steps: Generate Keys, Review Keys, Confirm", () => {
    render(<ManageKeysAddKeys onSuccess={vi.fn()} />);

    expect(screen.getByText("permissions.add-keys.stepper.generate-keys")).toBeInTheDocument();
    expect(screen.getByText("permissions.add-keys.stepper.review-keys")).toBeInTheDocument();
    expect(screen.getByText("permissions.add-keys.stepper.confirm")).toBeInTheDocument();
  });

  it("starts on step 1 (Generate Keys) showing master password", () => {
    render(<ManageKeysAddKeys onSuccess={vi.fn()} />);

    // Master password should be displayed
    expect(screen.getByText("P5TestMasterPasswordABC123")).toBeInTheDocument();
    // Warning section should be present
    expect(screen.getByText("permissions.add-keys.step2.warning-title")).toBeInTheDocument();
  });

  it("does not show the old authenticate step", () => {
    render(<ManageKeysAddKeys onSuccess={vi.fn()} />);

    // Should NOT have the old authenticate step
    expect(screen.queryByText("permissions.add-keys.stepper.authenticate")).not.toBeInTheDocument();
    // Should NOT show key input on first step
    expect(screen.queryByText("permissions.add-keys.step1.authenticate")).not.toBeInTheDocument();
  });
});
