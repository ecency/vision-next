import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the real SDK that the facade dynamically imports. vi.hoisted so the
// object exists when the hoisted vi.mock factory runs.
const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn(() => "evt-1"),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  captureFeedback: vi.fn(),
  flush: vi.fn(() => Promise.resolve(true))
}));
vi.mock("@sentry/nextjs", () => sdk);

describe("lazy-sentry facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules(); // fresh facade module-level state per test
  });

  it("does NOT load the SDK synchronously on a capture before configure", async () => {
    const { sentry } = await import("@/core/sentry/lazy-sentry");
    sentry.captureException(new Error("pre-config"));
    // Buffered; the SDK must not initialize or send until configured.
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.captureException).not.toHaveBeenCalled();
  });

  it("initializes and REPLAYS buffered captures once configured", async () => {
    const { sentry, configureLazySentry } = await import("@/core/sentry/lazy-sentry");
    const err = new Error("buffered");
    sentry.captureException(err);
    // Test env is non-production -> configure initializes immediately.
    configureLazySentry({ dsn: "x" } as never);
    await vi.waitFor(() => expect(sdk.init).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledWith(err));
    expect(sdk.setTag).toHaveBeenCalledWith("source", "client");
  });

  it("passes captures straight through after init", async () => {
    const { sentry, configureLazySentry } = await import("@/core/sentry/lazy-sentry");
    configureLazySentry({ dsn: "x" } as never);
    await vi.waitFor(() => expect(sdk.init).toHaveBeenCalled());
    const err = new Error("post-init");
    sentry.captureException(err);
    await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledWith(err));
  });

  it("replays early window errors WITH the ErrorEvent's source metadata", async () => {
    // A script parse failure (truncated chunk, old engine vs modern syntax)
    // throws a STACKLESS SyntaxError; the ErrorEvent's filename/position is the
    // only attribution, so the replay must carry it as `extra`
    // (ECENCY-NEXT-13K2 was unattributable because it was discarded).
    const { configureLazySentry } = await import("@/core/sentry/lazy-sentry");
    configureLazySentry({ dsn: "x" } as never);
    // The early listener attaches synchronously in configure; the SDK import
    // resolves on a later microtask, so this event lands in the pre-init buffer.
    const parseError = new SyntaxError("Unexpected end of input");
    window.dispatchEvent(
      new ErrorEvent("error", {
        error: parseError,
        filename: "https://example.com/_next/static/chunks/1234-abcdef.js",
        lineno: 1,
        colno: 98765,
        message: "Uncaught SyntaxError: Unexpected end of input"
      })
    );
    await vi.waitFor(() =>
      expect(sdk.captureException).toHaveBeenCalledWith(parseError, {
        extra: {
          earlySource: "https://example.com/_next/static/chunks/1234-abcdef.js",
          earlyPosition: "1:98765",
          earlyMessage: "Uncaught SyntaxError: Unexpected end of input"
        }
      })
    );
  });

  it("replays early unhandled rejections WITHOUT source metadata (none exists)", async () => {
    const { configureLazySentry } = await import("@/core/sentry/lazy-sentry");
    configureLazySentry({ dsn: "x" } as never);
    // jsdom has no PromiseRejectionEvent constructor; the handler only reads
    // `.reason`, so a plain event carrying it exercises the same path.
    const reason = new Error("early rejection");
    const evt = new Event("unhandledrejection");
    (evt as unknown as { reason: unknown }).reason = reason;
    window.dispatchEvent(evt);
    // Exactly one argument — no fabricated extra for rejections.
    await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledWith(reason));
  });

  it("caps the early-error buffer, keeping the FIRST errors (drop-newest)", async () => {
    const { configureLazySentry } = await import("@/core/sentry/lazy-sentry");
    configureLazySentry({ dsn: "x" } as never);
    const errors = Array.from({ length: 150 }, (_, i) => new Error(`e${i}`));
    for (const error of errors) {
      window.dispatchEvent(new ErrorEvent("error", { error, filename: "f.js" }));
    }
    await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledTimes(100));
    // Drop-NEWEST policy: the first errors on a page are the ones that explain
    // it, so e0..e99 must be replayed and e100+ discarded (a drop-oldest
    // regression would pass a size-only assertion).
    const captured = sdk.captureException.mock.calls.map((c) => c[0]);
    expect(captured[0]).toBe(errors[0]);
    expect(captured).toContain(errors[99]);
    expect(captured).not.toContain(errors[100]);
    expect(captured).not.toContain(errors[149]);
  });

  it("caps early unhandled rejections with the same limit", async () => {
    const { configureLazySentry } = await import("@/core/sentry/lazy-sentry");
    configureLazySentry({ dsn: "x" } as never);
    for (let i = 0; i < 150; i++) {
      const evt = new Event("unhandledrejection");
      (evt as unknown as { reason: unknown }).reason = new Error(`r${i}`);
      window.dispatchEvent(evt);
    }
    await vi.waitFor(() => expect(sdk.init).toHaveBeenCalled());
    await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledTimes(100));
  });
});
