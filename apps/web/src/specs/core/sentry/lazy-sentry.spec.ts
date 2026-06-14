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
});
