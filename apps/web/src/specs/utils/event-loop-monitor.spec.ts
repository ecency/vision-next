import { describe, expect, it } from "vitest";
import { sanitizeUrl } from "@/event-loop-monitor";

describe("sanitizeUrl", () => {
  it("returns path unchanged when no query or fragment", () => {
    expect(sanitizeUrl("/discover")).toBe("/discover");
    expect(sanitizeUrl("/")).toBe("/");
    expect(sanitizeUrl("/api/healthcheck")).toBe("/api/healthcheck");
  });

  it("strips query string", () => {
    expect(sanitizeUrl("/auth?code=secret_hs_token")).toBe("/auth");
    expect(sanitizeUrl("/api/mattermost/websocket?token=bearer_abc")).toBe(
      "/api/mattermost/websocket"
    );
    expect(sanitizeUrl("/search?q=hello&page=2")).toBe("/search");
  });

  it("strips fragment", () => {
    expect(sanitizeUrl("/faq#topic")).toBe("/faq");
    expect(sanitizeUrl("/proposals#123")).toBe("/proposals");
  });

  it("strips both when query comes before fragment", () => {
    expect(sanitizeUrl("/auth?code=secret#done")).toBe("/auth");
  });

  it("strips both when fragment comes before query", () => {
    // Edge case: fragment before query (not standards-compliant but shouldn't leak)
    expect(sanitizeUrl("/path#frag?token=secret")).toBe("/path");
  });

  it("handles empty query string", () => {
    expect(sanitizeUrl("/page?")).toBe("/page");
  });

  it("handles empty fragment", () => {
    expect(sanitizeUrl("/page#")).toBe("/page");
  });

  it("handles unknown input", () => {
    expect(sanitizeUrl("unknown")).toBe("unknown");
  });

  it("does not leak HiveSigner auth code", () => {
    const url = "/auth?code=eyJhbGciOiJIUzI1NiJ9.sensitive.token";
    expect(sanitizeUrl(url)).not.toContain("code=");
    expect(sanitizeUrl(url)).not.toContain("sensitive");
    expect(sanitizeUrl(url)).not.toContain("token");
  });

  it("does not leak mattermost bearer token", () => {
    const url = "/api/mattermost/websocket?token=bearer_xyz_secret_123";
    expect(sanitizeUrl(url)).not.toContain("token=");
    expect(sanitizeUrl(url)).not.toContain("secret");
  });
});
