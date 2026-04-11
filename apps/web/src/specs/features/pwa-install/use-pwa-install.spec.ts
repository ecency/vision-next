import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Fires a synthetic beforeinstallprompt event. We can't construct an actual
// BeforeInstallPromptEvent because it's not in jsdom, so we fake one by
// dispatching a plain Event and attaching the two fields our store reads.
interface FakeBeforeInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function makeFakePrompt(
  outcome: "accepted" | "dismissed" = "accepted"
): FakeBeforeInstallPrompt {
  const event = new Event("beforeinstallprompt") as FakeBeforeInstallPrompt;
  event.prompt = vi.fn(() => Promise.resolve());
  event.userChoice = Promise.resolve({ outcome, platform: "web" });
  return event;
}

// Reset the singleton store between tests. The store attaches listeners at
// module import time and guards with a global flag — resetting the module
// cache + flag forces re-initialization on the next import.
async function loadFreshStore() {
  vi.resetModules();
  // The flag is set on globalThis by the store module.
  delete (globalThis as unknown as Record<string, unknown>).__ecencyPwaInstallInitialized;
  const mod = await import("@/features/pwa-install/use-pwa-install");
  return mod.usePwaInstall;
}

describe("usePwaInstall", () => {
  beforeEach(() => {
    // Ensure we start each test with no lingering standalone state.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() })
    });
  });

  afterEach(() => {
    vi.resetModules();
    delete (globalThis as unknown as Record<string, unknown>).__ecencyPwaInstallInitialized;
  });

  it("reports canInstall: false before any beforeinstallprompt event", async () => {
    const usePwaInstall = await loadFreshStore();
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(false);
    expect(result.current.installed).toBe(false);
  });

  it("captures beforeinstallprompt events fired AFTER the hook mounts", async () => {
    const usePwaInstall = await loadFreshStore();
    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.canInstall).toBe(false);

    act(() => {
      window.dispatchEvent(makeFakePrompt());
    });

    await waitFor(() => {
      expect(result.current.canInstall).toBe(true);
    });
  });

  it("captures beforeinstallprompt events fired BEFORE the hook mounts (regression)", async () => {
    // This is the regression the agent flagged: with a per-component listener,
    // an event that fires before the consumer mounts would be lost forever.
    // The global module-level listener must catch it.
    const usePwaInstall = await loadFreshStore();

    window.dispatchEvent(makeFakePrompt());

    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(true);
  });

  it("install() consumes the deferred prompt and returns outcome", async () => {
    const usePwaInstall = await loadFreshStore();
    const prompt = makeFakePrompt("accepted");

    window.dispatchEvent(prompt);

    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(true);

    let outcome: Awaited<ReturnType<typeof result.current.install>> | undefined;
    await act(async () => {
      outcome = await result.current.install();
    });

    expect(outcome).toBe("accepted");
    expect(prompt.prompt).toHaveBeenCalledOnce();
    // After use, the stashed event is cleared and canInstall goes false.
    expect(result.current.canInstall).toBe(false);
  });

  it("install() returns 'unavailable' when no deferred prompt exists", async () => {
    const usePwaInstall = await loadFreshStore();
    const { result } = renderHook(() => usePwaInstall());

    let outcome: Awaited<ReturnType<typeof result.current.install>> | undefined;
    await act(async () => {
      outcome = await result.current.install();
    });
    expect(outcome).toBe("unavailable");
  });

  it("appinstalled event marks the app as installed", async () => {
    const usePwaInstall = await loadFreshStore();
    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.installed).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    await waitFor(() => {
      expect(result.current.installed).toBe(true);
    });
  });

  it("detects standalone display-mode at module init", async () => {
    // matchMedia must report standalone BEFORE the store module is loaded.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() })
    });

    const usePwaInstall = await loadFreshStore();
    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.installed).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it("canInstall is false once installed, even if a prompt is still stashed", async () => {
    const usePwaInstall = await loadFreshStore();
    window.dispatchEvent(makeFakePrompt());

    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    await waitFor(() => {
      expect(result.current.installed).toBe(true);
      expect(result.current.canInstall).toBe(false);
    });
  });
});
