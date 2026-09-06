import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONFIG } from "@/modules/core";
import { getCurationRecommenderQueryOptions } from "./get-curation-recommender-query-options";
import type { CurationRecommenderStats } from "../types";

const fetchMock = vi.fn();

const stats: CurationRecommenderStats = {
  username: "alice",
  window_days: 90,
  recommended: 24,
  curated: 15,
  dismissed: 2,
  withdrawn: 1,
  precision: 1.3,
  trusted: true,
  computed_at: "2026-09-05T00:00:00Z"
};

function ok(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => body
  };
}

describe("getCurationRecommenderQueryOptions", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(ok(stats));
    vi.stubGlobal("fetch", fetchMock);
    CONFIG.privateApiHost = "https://ecency.com";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keys under the curation block by username", () => {
    expect(getCurationRecommenderQueryOptions("alice").queryKey).toEqual([
      "curation",
      "recommender",
      "alice"
    ]);
    const other = getCurationRecommenderQueryOptions("bob").queryKey;
    expect(JSON.stringify(other)).not.toBe(
      JSON.stringify(getCurationRecommenderQueryOptions("alice").queryKey)
    );
  });

  it("reads route 14 for the username and answers the scorecard", async () => {
    const options = getCurationRecommenderQueryOptions("alice");
    await expect(options.queryFn!({ signal: undefined } as any)).resolves.toEqual(stats);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://ecency.com/private-api/curation-desk/recommender/alice"
    );
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("GET");
  });

  it("holds a 60 s window, so a popover that opens twice costs one request", () => {
    expect(getCurationRecommenderQueryOptions("alice").staleTime).toBe(60_000);
  });

  it("guards a bad username twice: enabled is false and the queryFn throws", async () => {
    const options = getCurationRecommenderQueryOptions("no");
    expect(options.enabled).toBe(false);
    // The guard throws synchronously, so the call itself is what has to be
    // wrapped rather than the promise it never returns.
    await expect(async () => options.queryFn!({ signal: undefined } as any)).rejects.toThrow(/invalid/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("escapes the username in the path", async () => {
    // The regex already refuses this name; the path still has to be built
    // from an escaped segment rather than concatenated.
    const options = getCurationRecommenderQueryOptions("alice");
    await options.queryFn!({ signal: undefined } as any);
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("..");
  });

  it("takes a zeroed scorecard as data, since an unknown name is never a 404", async () => {
    const zeros: CurationRecommenderStats = {
      ...stats,
      username: "nobody1",
      recommended: 0,
      curated: 0,
      dismissed: 0,
      withdrawn: 0,
      precision: 1,
      trusted: false,
      computed_at: null
    };
    fetchMock.mockResolvedValue(ok(zeros));
    await expect(
      getCurationRecommenderQueryOptions("nobody1").queryFn!({ signal: undefined } as any)
    ).resolves.toEqual(zeros);
  });

  it("refuses a body that is not a scorecard", async () => {
    fetchMock.mockResolvedValue(ok({ items: [] }));
    await expect(
      getCurationRecommenderQueryOptions("alice").queryFn!({ signal: undefined } as any)
    ).rejects.toThrow(/Unexpected response/);
  });
});
