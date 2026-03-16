import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useActiveAccount } from "@/core/hooks/use-active-account";

vi.mock("@/core/hooks/use-active-account");
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: null })),
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
    useMutation: vi.fn(() => ({ mutateAsync: vi.fn() }))
  };
});
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
// Mock step sub-components to isolate the orchestrator
vi.mock("@/app/(dynamicPages)/profile/[username]/permissions/_components/add-keys-steps", () => ({
  Step2GenerateSeed: ({ username, onNext }: any) => (
    <div data-testid="step2">
      <span>P5TestMasterPasswordABC123</span>
      <button onClick={() => onNext("P5TestMasterPasswordABC123")}>Continue</button>
    </div>
  ),
  Step3ReviewKeys: ({ onNext, onBack }: any) => (
    <div data-testid="step3">
      <button onClick={onBack}>Back</button>
      <button onClick={() => onNext({ owner: [], active: [], posting: [], memo: [] })}>Next</button>
    </div>
  ),
  Step4Confirm: ({ onBack, onSuccess }: any) => (
    <div data-testid="step4">
      <button onClick={onBack}>Back</button>
      <button onClick={onSuccess}>Confirm</button>
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

  it("renders 3 steps in stepper: Generate Keys, Review Keys, Confirm", () => {
    render(<ManageKeysAddKeys onSuccess={vi.fn()} />);

    expect(screen.getByText("permissions.add-keys.stepper.generate-keys")).toBeInTheDocument();
    expect(screen.getByText("permissions.add-keys.stepper.review-keys")).toBeInTheDocument();
    expect(screen.getByText("permissions.add-keys.stepper.confirm")).toBeInTheDocument();
  });

  it("starts on step 1 (Generate Keys)", () => {
    render(<ManageKeysAddKeys onSuccess={vi.fn()} />);
    expect(screen.getByTestId("step2")).toBeInTheDocument();
  });

  it("does not include authenticate step", () => {
    render(<ManageKeysAddKeys onSuccess={vi.fn()} />);
    expect(screen.queryByText("permissions.add-keys.stepper.authenticate")).not.toBeInTheDocument();
  });
});
