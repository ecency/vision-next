import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buyStreakFreezeRequest } from "./buy-streak-freeze";

describe("buyStreakFreezeRequest", () => {
  // getBoundFetch() caches the bound fetch on first call, so reuse one stable mock
  // and reset it per test (a fresh mock each test wouldn't be picked up).
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to /private-api/streak-freeze/buy with the code and a fresh idempotency key", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ owned: 1, points: 700 }) });

    const result = await buyStreakFreezeRequest("hs-token");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/private-api/streak-freeze/buy");
    expect((init as RequestInit).method).toBe("POST");
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.code).toBe("hs-token");
    expect(typeof payload.idempotency_key).toBe("string");
    expect(payload.idempotency_key.length).toBeGreaterThan(0);
    expect(result).toEqual({ owned: 1, points: 700 });
  });

  it("generates a distinct idempotency key per call", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ owned: 1, points: 700 }) });
    await buyStreakFreezeRequest("t");
    await buyStreakFreezeRequest("t");
    const k1 = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string).idempotency_key;
    const k2 = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string).idempotency_key;
    expect(k1).not.toBe(k2);
  });

  it("rethrows a 402 with status + server data so the caller can route to a top-up", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 402,
      json: async () => ({ message: "Insufficient points", required: 300, available: 100 }),
    });

    await expect(buyStreakFreezeRequest("t")).rejects.toMatchObject({
      status: 402,
      data: { required: 300, available: 100 },
    });
  });

  it("rethrows a 409 (max owned) with status attached", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: "Maximum freezes already owned", owned: 2 }),
    });

    await expect(buyStreakFreezeRequest("t")).rejects.toMatchObject({ status: 409 });
  });

  it("does not throw on a non-JSON error body (keeps the status)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    });

    await expect(buyStreakFreezeRequest("t")).rejects.toMatchObject({ status: 500 });
  });
});
