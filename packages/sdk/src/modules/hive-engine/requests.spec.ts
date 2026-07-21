import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getHiveEngineMetrics, getHiveEngineTokensMarket } from "./requests";

// getBoundFetch() caches the bound fetch on first call, so reuse one stable mock and
// reset it per test rather than recreating it.
const fetchMock = vi.fn();

const okResponse = (result: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ result }),
});

const lastPayload = () => JSON.parse(fetchMock.mock.calls.at(-1)![1].body as string);

describe("getHiveEngineMetrics", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(okResponse([]));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("queries a single symbol by equality", async () => {
    await getHiveEngineMetrics("LEO");

    expect(lastPayload().params.query).toEqual({ symbol: "LEO" });
  });

  // The node caps `find` at 1000 rows. Asking for the held symbols keeps every one of
  // them in the answer; scanning the unfiltered page dropped the overflow.
  it("queries a list of symbols with $in", async () => {
    await getHiveEngineMetrics(["LEO", "COFFEE", "BEE"]);

    expect(lastPayload().params.query).toEqual({
      symbol: { $in: ["LEO", "COFFEE", "BEE"] },
    });
  });

  it("does not fall back to an unfiltered scan for an empty symbol list", async () => {
    await expect(getHiveEngineMetrics([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still supports an unfiltered call when no symbol is given", async () => {
    await getHiveEngineMetrics();

    expect(lastPayload().params.query).toEqual({});
  });

  it("keeps the account filter alongside a symbol list", async () => {
    await getHiveEngineMetrics(["LEO"], "alice");

    expect(lastPayload().params.query).toEqual({
      symbol: { $in: ["LEO"] },
      account: "alice",
    });
  });

  it("passes a symbol list through the market alias", async () => {
    await getHiveEngineTokensMarket(undefined, ["LEO", "BEE"]);

    expect(lastPayload().params.query).toEqual({ symbol: { $in: ["LEO", "BEE"] } });
  });

  it("resolves to an empty list when the node fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    await expect(getHiveEngineMetrics(["LEO"])).resolves.toEqual([]);
  });
});
