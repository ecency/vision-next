import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock node:dns/promises and node:net before importing route
vi.mock("node:dns/promises", () => {
  const Resolver = vi.fn().mockImplementation(() => ({
    resolve4: vi.fn().mockResolvedValue(["93.184.216.34"]),
    resolve6: vi.fn().mockResolvedValue([])
  }));
  return { default: { Resolver }, Resolver };
});

vi.mock("node:net", () => {
  const isIP = vi.fn((ip: string) => {
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return 4;
    if (ip.includes(":")) return 6;
    return 0;
  });
  return { default: { isIP }, isIP };
});

vi.mock("@ecency/sdk", () => ({
  getPost: vi.fn()
}));

vi.mock("jsdom", () => ({
  JSDOM: vi.fn()
}));

vi.mock("@mozilla/readability", () => ({
  Readability: vi.fn()
}));

vi.mock("turndown", () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => ({
    turndown: vi.fn().mockReturnValue("# Test content")
  }))
}));

import { POST } from "@/app/api/import/route";
import { getPost } from "@ecency/sdk";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing url", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("import-error-invalid-url");
  });

  it("returns 400 for non-string url", async () => {
    const res = await POST(makeRequest({ url: 123 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("import-error-invalid-url");
  });

  it("returns 400 for malformed JSON body", async () => {
    const req = new NextRequest("http://localhost/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json"
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("import-error-invalid-url");
  });

  it("returns 400 for private IP URL", async () => {
    const res = await POST(makeRequest({ url: "http://192.168.1.1/test" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("import-error-invalid-url");
  });

  it("returns 400 for localhost URL", async () => {
    const res = await POST(makeRequest({ url: "http://localhost/test" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("import-error-invalid-url");
  });

  it("returns 404 when Hive post not found", async () => {
    vi.mocked(getPost).mockResolvedValue(undefined);

    const res = await POST(makeRequest({ url: "https://ecency.com/@testuser/test-post" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("import-error-not-found");
  });

  it("returns Hive post data on success", async () => {
    vi.mocked(getPost).mockResolvedValue({
      title: "Test Title",
      body: "# Hello World",
      json_metadata: {
        tags: ["test", "hive"],
        image: ["https://example.com/img.jpg"]
      }
    } as any);

    const res = await POST(makeRequest({ url: "https://ecency.com/@testuser/test-post" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("Test Title");
    expect(data.content).toBe("# Hello World");
    expect(data.thumbnail).toBe("https://example.com/img.jpg");
    expect(data.tags).toEqual(["test", "hive"]);
    expect(data.source).toBe("hive");
  });

  it("returns external article data on success", async () => {
    const mockDoc = {
      querySelector: vi.fn().mockReturnValue(null),
      querySelectorAll: vi.fn().mockReturnValue([])
    };

    vi.mocked(JSDOM).mockImplementation(() => ({
      window: { document: mockDoc }
    }) as any);

    vi.mocked(Readability).mockImplementation(() => ({
      parse: () => ({
        title: "External Article",
        content: "<p>Article body</p>"
      })
    }) as any);

    // Mock global fetch for fetchPage
    const mockResponse = {
      ok: true,
      status: 200,
      url: "https://example.com/article",
      headers: new Headers({ "content-type": "text/html" }),
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode("<html><body>test</body></html>")
            })
            .mockResolvedValueOnce({ done: true, value: undefined })
        })
      }
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as any);

    const res = await POST(makeRequest({ url: "https://example.com/article" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("External Article");
    expect(data.source).toBe("external");
    expect(data.content).toContain("Originally published on");
  });

  it("returns 500 with mapped error code for known errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("FETCH_FAILED"));

    const res = await POST(makeRequest({ url: "https://example.com/article" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("import-error-fetch-failed");
  });

  it("returns 500 with generic error for unknown errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("SOMETHING_UNEXPECTED"));

    const res = await POST(makeRequest({ url: "https://example.com/article" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("import-failed");
  });
});
