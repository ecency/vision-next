import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useActiveAccount } from "@/core/hooks/use-active-account";

vi.mock("@/utils/client", () => ({
  shouldUseHiveAuth: vi.fn(() => false)
}));
vi.mock("@/utils/keychain", () => ({
  isKeychainInAppBrowser: vi.fn(() => false)
}));
vi.mock("@/utils/user-token", () => ({
  getLoginType: vi.fn()
}));
vi.mock("@/utils", () => ({
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token"),
  useIsMobile: vi.fn(() => false)
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

    expect(screen.getByTestId("metamask-btn")).toBeDefined();
    // Should NOT show HiveSigner
    expect(screen.queryByText("key-or-hot.with-hivesigner")).toBeNull();
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

    expect(screen.getByText("key-or-hot.with-hivesigner")).toBeDefined();
    expect(screen.queryByTestId("metamask-btn")).toBeNull();
  });
});
