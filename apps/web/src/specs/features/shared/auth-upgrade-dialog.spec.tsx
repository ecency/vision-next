import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Controllable state shared with the hoisted vi.mock factories. Tests mutate
// `detected` / `kcMobile` to exercise the multi-extension, desktop-no-extension
// and Keychain-Mobile-fallback paths.
const h = vi.hoisted(() => ({
  detected: [
    { id: "hive-keeper", name: "Hive Keeper", icon: "/assets/keeper.svg" },
    { id: "keychain", name: "Keychain", icon: "/assets/keychain.png" }
  ] as { id: string; name: string; icon: string }[],
  kcMobile: false,
  setPreferredExtensionId: vi.fn(),
  resolveAuthUpgrade: vi.fn()
}));

// The global test setup stubs @/utils down to a couple of exports; restore the
// real module so UI components in the render tree (Modal/Button/KeyInput) work.
vi.mock("@/utils", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>())
}));

vi.mock("@/utils/client", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  shouldUseKeychainMobile: () => h.kcMobile
}));

vi.mock("@/utils/hive-extensions", () => ({
  getDetectedExtensions: () => h.detected,
  hasAnyHiveExtension: () => h.detected.length > 0,
  setPreferredExtensionId: (id: string | null) => h.setPreferredExtensionId(id)
}));

vi.mock("@/features/shared/auth-upgrade/auth-upgrade-events", () => ({
  resolveAuthUpgrade: (...args: unknown[]) => h.resolveAuthUpgrade(...args)
}));

import { AuthUpgradeDialog } from "@/features/shared/auth-upgrade";

function openDialog() {
  render(<AuthUpgradeDialog />);
  act(() => {
    window.dispatchEvent(
      new CustomEvent("ecency-auth-upgrade", {
        detail: { authority: "active", operation: "transfer" }
      })
    );
  });
}

// i18next is globally mocked to echo keys, so button labels are not the real
// "Sign with X" strings. Each extension button still carries an <img alt={name}>
// that contributes the extension name to the button's accessible name, so we
// match on that via a regex.
describe("AuthUpgradeDialog extension picker", () => {
  beforeEach(() => {
    h.detected = [
      { id: "hive-keeper", name: "Hive Keeper", icon: "/assets/keeper.svg" },
      { id: "keychain", name: "Keychain", icon: "/assets/keychain.png" }
    ];
    h.kcMobile = false;
    h.setPreferredExtensionId.mockClear();
    h.resolveAuthUpgrade.mockClear();
  });
  afterEach(cleanup);

  it("renders one sign button per detected extension", () => {
    openDialog();
    expect(screen.getByRole("button", { name: /hive keeper/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keychain/i })).toBeInTheDocument();
  });

  it("persists the chosen extension and resolves as keychain (no Keeper auto-pick)", () => {
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: /keychain/i }));

    // The user's explicit choice is stored so broadcastWithExtension targets
    // window.hive_keychain directly instead of falling back to Keeper-first.
    expect(h.setPreferredExtensionId).toHaveBeenCalledWith("keychain");
    expect(h.resolveAuthUpgrade).toHaveBeenCalledWith("keychain");
  });

  it("persists Keeper when Keeper is explicitly chosen", () => {
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: /hive keeper/i }));

    expect(h.setPreferredExtensionId).toHaveBeenCalledWith("hive-keeper");
    expect(h.resolveAuthUpgrade).toHaveBeenCalledWith("keychain");
  });

  it("offers no extension action on desktop when none is detected", () => {
    h.detected = [];
    openDialog();

    // HiveSigner is always available; the extension path must not render a
    // dead-end button when there's no extension and no mobile deep-link target.
    expect(screen.getByRole("button", { name: /hivesigner/i })).toBeInTheDocument();
    expect(screen.queryByAltText("extensions")).toBeNull();
    expect(screen.queryByRole("button", { name: /keeper|keychain/i })).toBeNull();
    expect(h.setPreferredExtensionId).not.toHaveBeenCalled();
  });

  it("keeps the generic deep-link button for Keychain Mobile with no extension", () => {
    h.detected = [];
    h.kcMobile = true;
    openDialog();

    const fallback = screen.getByRole("button", { name: /extensions/i });
    fireEvent.click(fallback);

    // Deep-link path resolves generically; it must NOT pin an extension
    // preference (there's no detected extension to pin).
    expect(h.resolveAuthUpgrade).toHaveBeenCalledWith("keychain");
    expect(h.setPreferredExtensionId).not.toHaveBeenCalled();
  });
});
