import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import {
  ServiceWorkerRecovery,
  isChunkLoadError
} from "@/features/pwa-install/service-worker-recovery";

describe("isChunkLoadError", () => {
  it("matches the chunk / dynamic-import failure messages", () => {
    expect(isChunkLoadError("ChunkLoadError: something")).toBe(true);
    expect(isChunkLoadError("Loading chunk 482 failed")).toBe(true);
    expect(isChunkLoadError("Loading CSS chunk 5 failed")).toBe(true);
    expect(isChunkLoadError("Failed to fetch dynamically imported module: /a.js")).toBe(true);
    expect(isChunkLoadError("error loading dynamically imported module")).toBe(true);
    expect(isChunkLoadError("Importing a module script failed.")).toBe(true);
  });

  it("ignores unrelated errors and empty input", () => {
    expect(isChunkLoadError("TypeError: x is not a function")).toBe(false);
    expect(isChunkLoadError("")).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});

describe("ServiceWorkerRecovery", () => {
  let reloadMock: ReturnType<typeof vi.fn>;
  const realLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...realLocation, reload: reloadMock }
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: realLocation });
    vi.restoreAllMocks();
  });

  it("reloads once on a chunk-load error, then not again in the same session", () => {
    render(<ServiceWorkerRecovery />);

    window.dispatchEvent(
      new ErrorEvent("error", { message: "ChunkLoadError: Loading chunk 7 failed" })
    );
    expect(reloadMock).toHaveBeenCalledTimes(1);

    // Session guard: a second chunk error must NOT trigger another reload loop.
    window.dispatchEvent(
      new ErrorEvent("error", { message: "ChunkLoadError: Loading chunk 9 failed" })
    );
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("does not reload on unrelated errors", () => {
    render(<ServiceWorkerRecovery />);

    window.dispatchEvent(new ErrorEvent("error", { message: "TypeError: boom" }));
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it("recovers from a rejected dynamic import", () => {
    render(<ServiceWorkerRecovery />);

    // jsdom's PromiseRejectionEvent constructor is unreliable; dispatch a plain
    // event carrying `reason`, which is all the handler reads.
    const event = new Event("unhandledrejection") as Event & { reason?: unknown };
    event.reason = new Error("Failed to fetch dynamically imported module: /_next/x.js");
    window.dispatchEvent(event);

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
