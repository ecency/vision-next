import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractPermlink } from "@/api/threespeak-embed/api";

// The 3Speak proxy now requires a HiveSigner OAuth token resolved from
// localStorage + user-token. These tests exercise fetch error propagation,
// not the auth path, so we stub the auth helpers to return a valid token.
vi.mock("@/utils/local-storage", () => ({
  get: vi.fn(() => "testuser")
}));
vi.mock("@/utils/user-token", () => ({
  getAccessToken: vi.fn(() => "valid-hs-token")
}));

describe("extractPermlink", () => {
  it("extracts permlink from ?v=user/permlink format", () => {
    expect(extractPermlink("https://play.3speak.tv/embed?v=alice/abcd1234")).toBe("abcd1234");
  });

  it("extracts permlink from @user/permlink format", () => {
    expect(extractPermlink("@alice/abcd1234")).toBe("abcd1234");
  });

  it("falls back to last segment", () => {
    expect(extractPermlink("https://example.com/videos/abcd1234")).toBe("abcd1234");
  });

  it("strips query params from last segment", () => {
    expect(extractPermlink("https://example.com/abcd1234?foo=bar")).toBe("abcd1234");
  });
});

describe("requestUploadToken error handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("attaches HTTP status to thrown error on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve('{"error":"3Speak integration not configured"}')
      })
    );

    const { uploadVideoEmbed } = await import("@/api/threespeak-embed/api");
    const file = new File(["test"], "test.mp4", { type: "video/mp4" });

    try {
      await uploadVideoEmbed(file, "testuser", true, () => {});
      expect.unreachable("should have thrown");
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.status).toBe(503);
      expect(e.message).toContain("503");
    }
  });

  it("attaches 401 status when auth fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('{"error":"Authentication required"}')
      })
    );

    const { uploadVideoEmbed } = await import("@/api/threespeak-embed/api");
    const file = new File(["test"], "test.mp4", { type: "video/mp4" });

    try {
      await uploadVideoEmbed(file, "testuser", true, () => {});
      expect.unreachable("should have thrown");
    } catch (e: any) {
      expect(e.status).toBe(401);
    }
  });
});
