import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useActiveAccount } from "@/core/hooks/use-active-account";

vi.mock("@/core/hooks/use-active-account");
vi.mock("@/utils/client", () => ({
  shouldUseKeychainMobile: vi.fn(() => false)
}));
vi.mock("@/utils/keychain", () => ({
  isKeychainInAppBrowser: vi.fn(() => false)
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
