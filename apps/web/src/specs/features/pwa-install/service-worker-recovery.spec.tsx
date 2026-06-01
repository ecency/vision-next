import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
// ServiceWorkerRecovery is imported dynamically per-test (see beforeEach) to reset
// its module-level reload guards; the pure helpers are imported statically.
import {
  isChunkLoadError,
  isDeploySkewError
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

describe("isDeploySkewError", () => {
  it("matches chunk-load errors (string or Error)", () => {
    expect(isDeploySkewError("ChunkLoadError: x")).toBe(true);
    expect(isDeploySkewError(new Error("Loading chunk 7 failed"))).toBe(true);
  });

  it("matches the webpack factory mismatch ONLY when thrown from the webpack runtime", () => {
    // The real post-deploy crash: undefined module factory in webpack-*.js.
    expect(
      isDeploySkewError({
        message: "Cannot read properties of undefined (reading 'call')",
        stack: "at a (https://ecency.com/_next/static/chunks/webpack-2bcfd50e3f341c1.js:1:1)"
      })
    ).toBe(true);
    // Safari phrasing, also from the webpack runtime.
    expect(
      isDeploySkewError({
        message: "undefined is not an object (evaluating 'r.call')",
        stack: "webpack-internal:///./node_modules/x"
      })
    ).toBe(true);
    // Firefox phrasing (ECENCY-NEXT-1FMZ).
    expect(
      isDeploySkewError({
        message: 'can\'t access property "call", e[c] is undefined',
        stack: "at a (https://ecency.com/_next/static/chunks/webpack-2bcfd50e.js:1:1)"
      })
    ).toBe(true);
  });

  it("does NOT fire on an unrelated `.call of undefined` app bug (no webpack frame)", () => {
    expect(
      isDeploySkewError({
        message: "Cannot read properties of undefined (reading 'call')",
        stack: "at handleClick (https://ecency.com/_next/static/chunks/app/page.js:5:9)"
      })
    ).toBe(false);
  });

  it("does NOT fire on a different undefined read even from the webpack runtime", () => {
    expect(
      isDeploySkewError({
        message: "Cannot read properties of undefined (reading 'foo')",
        stack: "at a (https://ecency.com/_next/static/chunks/webpack-abc.js:1:1)"
      })
    ).toBe(false);
  });

  it("ignores non-error input", () => {
    expect(isDeploySkewError(null)).toBe(false);
    expect(isDeploySkewError(undefined)).toBe(false);
    expect(isDeploySkewError(42)).toBe(false);
  });
});

describe("ServiceWorkerRecovery", () => {
  let reloadMock: ReturnType<typeof vi.fn>;
  const realLocation = window.location;
  let Recovery: (typeof import("@/features/pwa-install/service-worker-recovery"))["ServiceWorkerRecovery"];

  function mockServiceWorker(controller: object | null) {
    const target = Object.assign(new EventTarget(), { controller });
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: target });
    return target;
  }

  beforeEach(async () => {
    sessionStorage.clear();
    reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...realLocation, reload: reloadMock }
    });
    // Re-import per test so the module-level reload guards (controllerReloadStarted)
    // reset and can't leak between tests.
    vi.resetModules();
    Recovery = (await import("@/features/pwa-install/service-worker-recovery"))
      .ServiceWorkerRecovery;
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: realLocation });
    delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;
    vi.restoreAllMocks();
  });

  it("reloads once on a chunk-load error, then not again in the same session", () => {
    render(<Recovery />);

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

  it("reloads on an uncaught webpack factory mismatch (post-deploy skew)", () => {
    render(<Recovery />);

    const error = Object.assign(new Error("Cannot read properties of undefined (reading 'call')"), {
      stack: "at a (https://ecency.com/_next/static/chunks/webpack-2bcfd50e.js:1:1)"
    });
    window.dispatchEvent(new ErrorEvent("error", { message: error.message, error }));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("does not reload on unrelated errors", () => {
    render(<Recovery />);

    window.dispatchEvent(new ErrorEvent("error", { message: "TypeError: boom" }));
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it("recovers from a rejected dynamic import", () => {
    render(<Recovery />);

    // jsdom's PromiseRejectionEvent constructor is unreliable; dispatch a plain
    // event carrying `reason`, which is all the handler reads.
    const event = new Event("unhandledrejection") as Event & { reason?: unknown };
    event.reason = new Error("Failed to fetch dynamically imported module: /_next/x.js");
    window.dispatchEvent(event);

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("does not reload when sessionStorage is unusable (no reload loop)", () => {
    render(<Recovery />);

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage denied");
    });
    window.dispatchEvent(new ErrorEvent("error", { message: "ChunkLoadError: x" }));

    expect(reloadMock).not.toHaveBeenCalled();
  });

  it("reloads once when a new service worker takes control of an already-controlled page", () => {
    const sw = mockServiceWorker({}); // controller present at mount → armed
    render(<Recovery />);

    sw.dispatchEvent(new Event("controllerchange"));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("does not reload on controllerchange when the page had no controller at mount", () => {
    const sw = mockServiceWorker(null); // no controller → not armed (initial claim)
    render(<Recovery />);

    sw.dispatchEvent(new Event("controllerchange"));
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
