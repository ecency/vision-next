import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { claimPointsRequest } from "./use-claim-points";

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json; charset=utf-8" },
    text: async () => JSON.stringify(data),
  };
}

function htmlResponse(html: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "text/html; charset=utf-8" },
    text: async () => html,
  };
}

describe("claimPointsRequest", () => {
  // getBoundFetch() caches the bound fetch on first call, so reuse one stable
  // mock and reset it per test.
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to /private-api/points-claim with the access code and returns JSON", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ points: "10.000" }));

    const result = await claimPointsRequest("alice", "hs-token");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/private-api/points-claim");
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse((init as RequestInit).body as string).code).toBe("hs-token");
    expect(result).toEqual({ points: "10.000" });
  });

  it("throws a stable, body-free error on a 2xx non-JSON (HTML) response (ECENCY-NEXT-1FCJ)", async () => {
    // An edge/proxy interstitial served with a 200 must not surface as a bare
    // SyntaxError, and the raw HTML must NOT leak into the message (else Sentry
    // fragments the issue per distinct page).
    fetchMock.mockResolvedValueOnce(
      htmlResponse("<!DOCTYPE html><html><body>Attention Required</body></html>")
    );

    await expect(claimPointsRequest("alice", "hs-token")).rejects.toThrow(
      /expected JSON but received "text\/html" response \(status 200\)/
    );
    await expect(claimPointsRequest("alice", "hs-token")).rejects.not.toThrow(
      /DOCTYPE|Attention/
    );
  });

  it("throws a stable error when a JSON content-type carries a malformed body", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => "{ not json",
    });

    await expect(claimPointsRequest("alice", "hs-token")).rejects.toThrow(
      /malformed JSON response \(status 200\)/
    );
  });

  it("still parses a 406 JSON body without throwing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 406,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ message: "already claimed", code: 406 }),
    });

    await expect(claimPointsRequest("alice", "hs-token")).resolves.toEqual({
      message: "already claimed",
      code: 406,
    });
  });

  it("throws early when username or access token is missing", async () => {
    await expect(claimPointsRequest(undefined, "t")).rejects.toThrow(/username wasn't provided/);
    await expect(claimPointsRequest("alice", undefined)).rejects.toThrow(/access token wasn't found/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
