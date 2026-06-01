import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// useIsMobile pulls window.matchMedia (absent in jsdom); stub it to desktop.
vi.mock("@/utils", async () => {
  const actual = await vi.importActual<any>("@/utils");
  return { ...actual, useIsMobile: () => false };
});

const detected = [
  { id: "hive-keeper", name: "Hive Keeper", icon: "/assets/keeper.svg" },
  { id: "keychain", name: "Keychain", icon: "/assets/keychain.png" },
];

const setPreferredExtensionId = vi.fn();
vi.mock("@/utils/hive-extensions", () => ({
  getDetectedExtensions: () => detected,
  hasAnyHiveExtension: () => true,
  setPreferredExtensionId: (id: string | null) => setPreferredExtensionId(id),
}));

const resolveAuthUpgrade = vi.fn();
vi.mock("@/features/shared/auth-upgrade/auth-upgrade-events", () => ({
  resolveAuthUpgrade: (...args: unknown[]) => resolveAuthUpgrade(...args),
}));

import { AuthUpgradeDialog } from "@/features/shared/auth-upgrade";

function openDialog() {
  render(<AuthUpgradeDialog />);
  act(() => {
    window.dispatchEvent(
      new CustomEvent("ecency-auth-upgrade", {
        detail: { authority: "active", operation: "transfer" },
      })
    );
  });
}

describe("AuthUpgradeDialog extension picker", () => {
  beforeEach(() => {
    setPreferredExtensionId.mockClear();
    resolveAuthUpgrade.mockClear();
  });
  afterEach(cleanup);

  it("renders one sign button per detected extension", () => {
    openDialog();
    // Each extension button carries an <img> whose alt is the extension name.
    expect(screen.getByAltText("Hive Keeper")).toBeInTheDocument();
    expect(screen.getByAltText("Keychain")).toBeInTheDocument();
  });

  it("persists the chosen extension and resolves as keychain (no Keeper auto-pick)", () => {
    openDialog();

    const keychainBtn = screen.getByAltText("Keychain").closest("button");
    expect(keychainBtn).not.toBeNull();
    fireEvent.click(keychainBtn!);

    // The user's explicit choice is stored so broadcastWithExtension targets
    // window.hive_keychain directly instead of falling back to Keeper-first.
    expect(setPreferredExtensionId).toHaveBeenCalledWith("keychain");
    expect(resolveAuthUpgrade).toHaveBeenCalledWith("keychain");
  });

  it("persists Keeper when Keeper is explicitly chosen", () => {
    openDialog();

    const keeperBtn = screen.getByAltText("Hive Keeper").closest("button");
    fireEvent.click(keeperBtn!);

    expect(setPreferredExtensionId).toHaveBeenCalledWith("hive-keeper");
    expect(resolveAuthUpgrade).toHaveBeenCalledWith("keychain");
  });
});
