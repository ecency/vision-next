import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useActiveAccount } from "@/core/hooks/use-active-account";

const ext = vi.hoisted(() => ({
  detected: [] as { id: string; name: string; icon: string }[],
  setPreferredExtensionId: vi.fn(),
  calls: [] as string[]
}));

vi.mock("@/utils/hive-extensions", () => ({
  getDetectedExtensions: () => ext.detected,
  hasAnyHiveExtension: () => ext.detected.length > 0,
  setPreferredExtensionId: (username: string, id: string | null) => {
    ext.calls.push("persist");
    ext.setPreferredExtensionId(username, id);
  }
}));

vi.mock("@/core/hooks/use-active-account");
vi.mock("@/utils/client", () => ({
  shouldUseKeychainMobile: vi.fn(() => false)
}));
vi.mock("@/utils/keychain", () => ({
  isInAppBrowser: vi.fn(() => false)
}));
vi.mock("@/utils/user-token", () => ({
  getLoginType: vi.fn()
}));
vi.mock("@/utils", () => ({
  useIsMobile: vi.fn(() => false),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));
vi.mock("@/features/shared/metamask-sign-button", () => ({
  MetaMaskSignButton: ({ onClick }: any) => (
    <button onClick={onClick} data-testid="metamask-btn">Sign with MetaMask</button>
  )
}));

import { getLoginType } from "@/utils/user-token";
import { KeyOrHot } from "@/features/shared/key-or-hot";

describe("KeyOrHot - MetaMask rendering", () => {
  const defaultProps = {
    inProgress: false,
    onKey: vi.fn(),
    onHot: vi.fn(),
    onKc: vi.fn(),
    onMetaMask: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows only MetaMask button when logged in with MetaMask", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "metamaskuser" }
    });
    (getLoginType as any).mockReturnValue("metamask");

    render(<KeyOrHot {...defaultProps} />);

    expect(screen.getByTestId("metamask-btn")).toBeInTheDocument();
    // Should NOT show other signing options
    expect(screen.queryByText("key-or-hot.with-hivesigner")).not.toBeInTheDocument();
  });

  it("calls onMetaMask when MetaMask button is clicked", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "metamaskuser" }
    });
    (getLoginType as any).mockReturnValue("metamask");

    render(<KeyOrHot {...defaultProps} />);
    fireEvent.click(screen.getByTestId("metamask-btn"));
    expect(defaultProps.onMetaMask).toHaveBeenCalledTimes(1);
  });

  it("shows HiveSigner for non-MetaMask users", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "keychainuser" }
    });
    (getLoginType as any).mockReturnValue("keychain");

    render(<KeyOrHot {...defaultProps} />);

    expect(screen.getByText("key-or-hot.with-hivesigner")).toBeInTheDocument();
    expect(screen.queryByTestId("metamask-btn")).not.toBeInTheDocument();
  });
});

describe("KeyOrHot - extension picker (respects the user's chosen extension)", () => {
  const props = {
    inProgress: false,
    onKey: vi.fn(),
    onHot: vi.fn(),
    onKc: vi.fn(),
    onMetaMask: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ext.detected = [];
    ext.calls = [];
    (useActiveAccount as any).mockReturnValue({ activeUser: { username: "alice" } });
    (getLoginType as any).mockReturnValue("keychain");
  });

  it("with one extension, persists it for the active user BEFORE signing", () => {
    ext.detected = [{ id: "keychain", name: "Keychain", icon: "/assets/keychain.png" }];
    render(<KeyOrHot {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /key-or-hot\.with-extension/i }));

    // Regression: the chosen extension must be persisted (so the downstream
    // broadcast targets it) before onKc fires, otherwise the broadcast
    // auto-detects Keeper-first and hijacks a Keychain user.
    expect(ext.setPreferredExtensionId).toHaveBeenCalledWith("alice", "keychain");
    expect(props.onKc).toHaveBeenCalledTimes(1);
    expect(ext.calls).toEqual(["persist"]);
  });

  it("with more than one extension, opens the chooser and routes to the picked one", () => {
    ext.detected = [
      { id: "hive-keeper", name: "Hive Keeper", icon: "/assets/keeper.svg" },
      { id: "keychain", name: "Keychain", icon: "/assets/keychain.png" }
    ];
    render(<KeyOrHot {...props} />);

    // First click opens the chooser; it must NOT sign yet (no auto Keeper pick).
    fireEvent.click(screen.getByRole("button", { name: /key-or-hot\.with-extension/i }));
    expect(props.onKc).not.toHaveBeenCalled();
    expect(ext.setPreferredExtensionId).not.toHaveBeenCalled();

    // Picking Keychain persists Keychain (not Keeper) then signs.
    fireEvent.click(screen.getByRole("button", { name: /keychain/i }));
    expect(ext.setPreferredExtensionId).toHaveBeenCalledWith("alice", "keychain");
    expect(props.onKc).toHaveBeenCalledTimes(1);
  });
});
