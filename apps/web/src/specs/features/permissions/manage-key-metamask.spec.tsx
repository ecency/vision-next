import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useActiveAccount } from "@/core/hooks/use-active-account";

vi.mock("@/core/hooks/use-active-account");
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return { ...actual, useQuery: vi.fn() };
});
vi.mock("@/utils/user-token", () => ({
  getLoginType: vi.fn()
}));
vi.mock("react-use", () => ({
  useCopyToClipboard: vi.fn(() => [null, vi.fn()])
}));
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));
vi.mock("@/app/(dynamicPages)/profile/[username]/permissions/_components/manage-key-password-dialog", () => ({
  ManageKeyPasswordDialog: () => null
}));
vi.mock("@/app/(dynamicPages)/profile/[username]/permissions/_hooks", () => ({
  useRevealedKeysStore: vi.fn(() => ({})),
  useKeyDerivationStore: vi.fn((selector: any) => selector({ getDerivation: () => "unknown" }))
}));

import { useQuery } from "@tanstack/react-query";
import { getLoginType } from "@/utils/user-token";
import { ManageKey } from "@/app/(dynamicPages)/profile/[username]/permissions/_components/manage-key";

const mockAccountData = {
  owner: [["STM_OWNER_PUB_KEY", 1]],
  active: [["STM_ACTIVE_PUB_KEY", 1]],
  posting: [["STM_POSTING_PUB_KEY", 1]],
  weight: 1,
  memo: [["STM_MEMO_PUB_KEY", 1]]
};

describe("ManageKey - MetaMask user", () => {
  beforeEach(() => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "testuser" }
    });
    (useQuery as any).mockReturnValue({ data: mockAccountData });
  });

  it("hides private key row for MetaMask users", () => {
    (getLoginType as any).mockReturnValue("metamask");
    render(<ManageKey keyName="owner" onRevoke={vi.fn()} />);

    expect(screen.getByText("STM_OWNER_PUB_KEY")).toBeInTheDocument();
    expect(screen.queryByText(/\*{10,}/)).not.toBeInTheDocument();
  });

  it("shows private key row for non-MetaMask users", () => {
    (getLoginType as any).mockReturnValue("keychain");
    render(<ManageKey keyName="owner" onRevoke={vi.fn()} />);

    expect(screen.getByText("STM_OWNER_PUB_KEY")).toBeInTheDocument();
    expect(screen.getByText(/\*{10,}/)).toBeInTheDocument();
  });

  it("shows MetaMask badge for MetaMask users", () => {
    (getLoginType as any).mockReturnValue("metamask");
    render(<ManageKey keyName="owner" onRevoke={vi.fn()} />);
    expect(screen.getByText("MetaMask")).toBeInTheDocument();
  });

  it("shows Keychain badge for Keychain users", () => {
    (getLoginType as any).mockReturnValue("keychain");
    render(<ManageKey keyName="owner" onRevoke={vi.fn()} />);
    expect(screen.getByText("Keychain")).toBeInTheDocument();
  });
});
