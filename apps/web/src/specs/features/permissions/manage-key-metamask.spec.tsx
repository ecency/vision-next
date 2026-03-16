import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useActiveAccount } from "@/core/hooks/use-active-account";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn()
  };
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
    render(<ManageKey keyName="owner" />);

    // Public key should be visible
    expect(screen.getByText("STM_OWNER_PUB_KEY")).toBeDefined();
    // Private key asterisks should NOT be visible
    expect(screen.queryByText(/\*{10,}/)).toBeNull();
  });

  it("shows private key row for non-MetaMask users", () => {
    (getLoginType as any).mockReturnValue("keychain");
    render(<ManageKey keyName="owner" />);

    expect(screen.getByText("STM_OWNER_PUB_KEY")).toBeDefined();
    // Private key asterisks should be visible
    expect(screen.getByText(/\*{10,}/)).toBeDefined();
  });

  it("shows MetaMask badge for MetaMask users", () => {
    (getLoginType as any).mockReturnValue("metamask");
    render(<ManageKey keyName="owner" />);
    expect(screen.getByText("MetaMask")).toBeDefined();
  });

  it("shows Keychain badge for Keychain users", () => {
    (getLoginType as any).mockReturnValue("keychain");
    render(<ManageKey keyName="owner" />);
    expect(screen.getByText("Keychain")).toBeDefined();
  });
});
