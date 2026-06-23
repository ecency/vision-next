import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@/utils/hive-extensions", () => ({
  getPreferredExtensionId: vi.fn()
}));

import { getPreferredExtensionId } from "@/utils/hive-extensions";
import { LoginTypeBadge } from "@/features/shared/login/login-type-badge";

function imgSrc(container: HTMLElement) {
  return container.querySelector("img")?.getAttribute("src");
}

describe("LoginTypeBadge", () => {
  beforeEach(() => {
    (getPreferredExtensionId as any).mockReset();
    (getPreferredExtensionId as any).mockReturnValue(null);
  });

  it("shows the Keychain icon for a keychain login with no saved preference", async () => {
    const { container } = render(<LoginTypeBadge username="alice" loginType="keychain" />);
    await waitFor(() => expect(imgSrc(container)).toBe("/assets/keychain.png"));
  });

  it("refines a keychain login to the Keeper icon from the saved per-user preference", async () => {
    (getPreferredExtensionId as any).mockReturnValue("hive-keeper");
    const { container } = render(<LoginTypeBadge username="alice" loginType="keychain" />);
    await waitFor(() => expect(imgSrc(container)).toBe("/assets/keeper.svg"));
    expect(getPreferredExtensionId).toHaveBeenCalledWith("alice");
  });

  it("refines a keychain login to the Peak Vault icon from the saved per-user preference", async () => {
    (getPreferredExtensionId as any).mockReturnValue("peakvault");
    const { container } = render(<LoginTypeBadge username="alice" loginType="keychain" />);
    await waitFor(() => expect(imgSrc(container)).toBe("/assets/peakvault.svg"));
  });

  it("never refines a keychain-mobile login from the desktop extension preference", async () => {
    // keychain-mobile is the mobile deep-link path; a desktop Keeper preference
    // must not override its badge.
    (getPreferredExtensionId as any).mockReturnValue("hive-keeper");
    const { container } = render(<LoginTypeBadge username="alice" loginType="keychain-mobile" />);
    await waitFor(() => expect(imgSrc(container)).toBe("/assets/keychain.png"));
    expect(getPreferredExtensionId).not.toHaveBeenCalled();
  });

  it("shows the MetaMask icon for a metamask login", async () => {
    const { container } = render(<LoginTypeBadge username="alice" loginType="metamask" />);
    await waitFor(() => expect(imgSrc(container)).toBe("/assets/metamask-fox.svg"));
  });

  it("shows the HiveSigner icon for a hivesigner login", async () => {
    const { container } = render(<LoginTypeBadge username="alice" loginType="hivesigner" />);
    await waitFor(() => expect(imgSrc(container)).toBe("/assets/hive-signer.svg"));
  });

  it("falls back to the Hive logo for a private key login", async () => {
    const { container } = render(<LoginTypeBadge username="alice" loginType="privateKey" />);
    await waitFor(() => expect(imgSrc(container)).toBe("/assets/hive-logo.svg"));
  });
});
