// @vitest-environment node
import { describe, it, expect, afterEach, vi } from "vitest";
import { GET } from "@/app/api/version/route";

describe("/api/version route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the deployed build id from SENTRY_RELEASE", async () => {
    vi.stubEnv("SENTRY_RELEASE", "ecency-next@abc1234");
    const res = GET();
    expect(await res.json()).toEqual({ buildId: "ecency-next@abc1234" });
  });

  it("returns null when SENTRY_RELEASE is unset (local dev)", async () => {
    vi.stubEnv("SENTRY_RELEASE", undefined);
    const res = GET();
    expect(await res.json()).toEqual({ buildId: null });
  });

  it("is served no-store so neither CDN nor a stale client caches the build id", () => {
    const res = GET();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
