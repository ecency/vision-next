// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the data + base-url deps so the route test stays isolated from
// SDK/Redis. parse-entry-url is left real (pure).
vi.mock("@/app/(dynamicPages)/entry/_helpers/agent-readable", () => ({
  loadEntry: vi.fn(),
  AGENT_CACHE_CONTROL: "public, max-age=0, s-maxage=300, stale-while-revalidate=86400"
}));
vi.mock("@/app/(dynamicPages)/entry/_helpers/entry-card-fields", () => ({
  buildEntryCardFields: vi.fn()
}));
vi.mock("@/utils/server-app-base", () => ({
  getServerAppBase: vi.fn(async () => "https://ecency.com")
}));

import { GET } from "@/app/api/oembed/route";
import { loadEntry } from "@/app/(dynamicPages)/entry/_helpers/agent-readable";
import { buildEntryCardFields } from "@/app/(dynamicPages)/entry/_helpers/entry-card-fields";
import { getServerAppBase } from "@/utils/server-app-base";

function get(query: string): Promise<Response> {
  return GET(new Request(`https://ecency.com/api/oembed?${query}`));
}

describe("GET /api/oembed", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when the url param is missing (with noindex)", async () => {
    const res = await get("");
    expect(res.status).toBe(400);
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(loadEntry).not.toHaveBeenCalled();
  });

  it("returns 400 for an unsupported (non-json) format", async () => {
    // 400 not 501: a 5xx from origin gets rewritten to 502 by our CF failover.
    const res = await get(`format=xml&url=${encodeURIComponent("https://ecency.com/@alice/p")}`);
    expect(res.status).toBe(400);
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(loadEntry).not.toHaveBeenCalled();
  });

  it("returns 404 for a non-ecency url and never touches the loader", async () => {
    const res = await get(`url=${encodeURIComponent("https://evil.com/@alice/p")}`);
    expect(res.status).toBe(404);
    expect(loadEntry).not.toHaveBeenCalled();
  });

  it("returns 404 when the post cannot be resolved", async () => {
    vi.mocked(loadEntry).mockResolvedValue(null);
    const res = await get(`url=${encodeURIComponent("https://ecency.com/@alice/missing")}`);
    expect(res.status).toBe(404);
    expect(loadEntry).toHaveBeenCalledWith("alice", "missing");
  });

  it("returns a type:link payload with the right fields and headers", async () => {
    vi.mocked(loadEntry).mockResolvedValue({
      entry: { author: "alice" } as any,
      source: "hive_condenser"
    });
    vi.mocked(buildEntryCardFields).mockReturnValue({
      title: "My Title",
      summary: "My summary",
      cardSummary: "My summary",
      image: "https://img/cover.png",
      isComment: false
    });

    const res = await get(`url=${encodeURIComponent("https://ecency.com/@alice/my-post")}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");

    expect(await res.json()).toMatchObject({
      version: "1.0",
      type: "link",
      title: "My Title",
      author_name: "alice",
      author_url: "https://ecency.com/@alice",
      provider_name: "Ecency",
      provider_url: "https://ecency.com",
      description: "My summary",
      thumbnail_url: "https://img/cover.png",
      thumbnail_width: 1200,
      thumbnail_height: 630,
      cache_age: 300
    });
  });

  it("omits thumbnail fields when the post has no image", async () => {
    vi.mocked(loadEntry).mockResolvedValue({
      entry: { author: "alice" } as any,
      source: "hive_bridge"
    });
    vi.mocked(buildEntryCardFields).mockReturnValue({
      title: "T",
      summary: "S",
      cardSummary: "S",
      image: null,
      isComment: false
    });

    const res = await get(`url=${encodeURIComponent("https://ecency.com/@alice/my-post")}`);
    const body = await res.json();
    expect(body.thumbnail_url).toBeUndefined();
    expect(body.thumbnail_width).toBeUndefined();
  });

  it("returns 500 (not 404) and logs when building the response throws", async () => {
    vi.mocked(loadEntry).mockResolvedValue({
      entry: { author: "alice" } as any,
      source: "hive_condenser"
    });
    vi.mocked(getServerAppBase).mockRejectedValueOnce(new Error("boom"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await get(`url=${encodeURIComponent("https://ecency.com/@alice/my-post")}`);
    expect(res.status).toBe(500);
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
