import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractPermlink, getUploadTuning } from "@/api/threespeak-embed/api";

// The 3Speak proxy now requires a HiveSigner OAuth token resolved from
// localStorage + user-token. These tests exercise fetch error propagation,
// not the auth path, so we stub the auth helpers to return a valid token.
vi.mock("@/utils/local-storage", () => ({
  get: vi.fn(() => "testuser")
}));
vi.mock("@/utils/user-token", () => ({
  getAccessToken: vi.fn(() => "valid-hs-token")
}));

// Drive tus-js-client's upload callbacks deterministically. `runUpload` is set
// per-test to simulate the sequence of onAfterResponse / onSuccess calls.
const tusMock = vi.hoisted(() => ({
  runUpload: (_options: any) => {}
}));

vi.mock("tus-js-client", () => ({
  Upload: class {
    options: any;
    constructor(_file: unknown, options: any) {
      this.options = options;
    }
    start() {
      tusMock.runUpload(this.options);
    }
  }
}));

// A tus response whose getHeader returns `embedUrl` for the X-Embed-URL header.
function mockRes(embedUrl: string | null) {
  return { getHeader: (h: string) => (/^x-embed-url$/i.test(h) ? embedUrl : null) };
}
// A tus request whose getHeader returns `uploadConcat` for Upload-Concat.
function mockReq(uploadConcat?: string) {
  return { getHeader: (h: string) => (h === "Upload-Concat" ? uploadConcat : undefined) };
}

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

describe("getUploadTuning", () => {
  const MB = 1024 * 1024;

  it("keeps small files (<= 10 MB) sequential", () => {
    expect(getUploadTuning(0)).toEqual({ chunkSize: 5 * MB, parallelUploads: 1 });
    expect(getUploadTuning(1024)).toEqual({ chunkSize: 5 * MB, parallelUploads: 1 });
    expect(getUploadTuning(10 * MB)).toEqual({ chunkSize: 5 * MB, parallelUploads: 1 });
  });

  it("uses 10 MB x 3 parallel above 10 MB up to 500 MB", () => {
    expect(getUploadTuning(10 * MB + 1)).toEqual({ chunkSize: 10 * MB, parallelUploads: 3 });
    expect(getUploadTuning(100 * MB)).toEqual({ chunkSize: 10 * MB, parallelUploads: 3 });
    expect(getUploadTuning(500 * MB)).toEqual({ chunkSize: 10 * MB, parallelUploads: 3 });
  });

  it("uses 20 MB x 3 parallel above 500 MB", () => {
    expect(getUploadTuning(500 * MB + 1)).toEqual({ chunkSize: 20 * MB, parallelUploads: 3 });
    expect(getUploadTuning(2 * 1024 * MB)).toEqual({ chunkSize: 20 * MB, parallelUploads: 3 });
  });
});

describe("uploadVideoEmbed embed-url resolution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: "tok", upload_url: "https://embed.example/uploads" })
      })
    );
  });

  // > 10 MB so getUploadTuning selects parallelUploads = 3.
  const bigFile = () =>
    new File([new Uint8Array(11 * 1024 * 1024)], "big.mp4", { type: "video/mp4" });
  // <= 10 MB so getUploadTuning selects parallelUploads = 1 (sequential).
  const smallFile = () => new File(["x"], "small.mp4", { type: "video/mp4" });

  it("falls back to sequential when the parallel attempt has no final-concat URL", async () => {
    tusMock.runUpload = (options) => {
      if (options.parallelUploads > 1) {
        // Parallel attempt: only a partial-creation URL, no final concat -> rejects.
        options.onAfterResponse(
          mockReq("partial"),
          mockRes("https://play.3speak.tv/embed?v=a/PART01")
        );
        options.onSuccess();
      } else {
        // Sequential retry: backend returns a usable embed URL.
        options.onAfterResponse(mockReq(), mockRes("https://play.3speak.tv/embed?v=a/SEQFALL01"));
        options.onSuccess();
      }
    };
    const { uploadVideoEmbed } = await import("@/api/threespeak-embed/api");
    await expect(uploadVideoEmbed(bigFile(), "a", false, () => {})).resolves.toEqual({
      embedUrl: "https://play.3speak.tv/embed?v=a/SEQFALL01",
      permlink: "SEQFALL01"
    });
  });

  it("resolves a parallel upload to the final-concat embed URL", async () => {
    tusMock.runUpload = (options) => {
      options.onAfterResponse(
        mockReq("partial"),
        mockRes("https://play.3speak.tv/embed?v=a/PART01")
      );
      options.onAfterResponse(
        mockReq("final;https://embed.example/a https://embed.example/b"),
        mockRes("https://play.3speak.tv/embed?v=a/FINAL567")
      );
      options.onSuccess();
    };
    const { uploadVideoEmbed } = await import("@/api/threespeak-embed/api");
    await expect(uploadVideoEmbed(bigFile(), "a", false, () => {})).resolves.toEqual({
      embedUrl: "https://play.3speak.tv/embed?v=a/FINAL567",
      permlink: "FINAL567"
    });
  });

  it("uses the last-seen embed URL for a sequential upload (no concat step)", async () => {
    tusMock.runUpload = (options) => {
      // Sequential path: requests carry no Upload-Concat header.
      options.onAfterResponse(mockReq(), mockRes("https://play.3speak.tv/embed?v=a/SEQ12345"));
      options.onSuccess();
    };
    const { uploadVideoEmbed } = await import("@/api/threespeak-embed/api");
    await expect(uploadVideoEmbed(smallFile(), "a", false, () => {})).resolves.toEqual({
      embedUrl: "https://play.3speak.tv/embed?v=a/SEQ12345",
      permlink: "SEQ12345"
    });
  });

  it("propagates the error when both the parallel and sequential attempts fail", async () => {
    tusMock.runUpload = (options) => {
      options.onError(new Error("network down"));
    };
    const { uploadVideoEmbed } = await import("@/api/threespeak-embed/api");
    await expect(uploadVideoEmbed(bigFile(), "a", false, () => {})).rejects.toThrow(/network down/);
  });
});
