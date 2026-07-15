import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  chatApiFetch,
  chatApiPauseRemaining,
  chatPollInterval,
  resetChatApiGuard
} from "@/features/chat/chat-api-guard";

function mockResponse(status: number, headers: Record<string, string> = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers)
  } as Response;
}

function pollQuery(
  status: string,
  fetchFailureCount = 0,
  errorUpdateCount = fetchFailureCount,
  queryHash = "test-query"
) {
  return { queryHash, state: { status, fetchFailureCount, errorUpdateCount } };
}

describe("chatApiFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetChatApiGuard();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("passes through normal responses without opening the pause", async () => {
    fetchMock.mockResolvedValue(mockResponse(200));

    const res = await chatApiFetch("/api/mattermost/channels");

    expect(res.status).toBe(200);
    expect(chatApiPauseRemaining()).toBe(0);
  });

  it("passes through server errors without opening the pause", async () => {
    fetchMock.mockResolvedValue(mockResponse(500));

    const res = await chatApiFetch("/api/mattermost/channels");

    expect(res.status).toBe(500);
    expect(chatApiPauseRemaining()).toBe(0);
  });

  it("opens a pause on 429 and short-circuits subsequent calls", async () => {
    fetchMock.mockResolvedValue(mockResponse(429));

    await chatApiFetch("/api/mattermost/channels/unreads");
    expect(chatApiPauseRemaining()).toBeGreaterThan(0);

    await expect(chatApiFetch("/api/mattermost/channels")).rejects.toThrow(/paused/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the longer pause when a concurrent 429 carries a shorter window", async () => {
    resetChatApiGuard();
    fetchMock.mockResolvedValueOnce(mockResponse(429, { "Retry-After": "600" }));
    const first = chatApiFetch("/api/mattermost/channels/unreads");
    fetchMock.mockResolvedValueOnce(mockResponse(429, { "Retry-After": "30" }));
    const second = chatApiFetch("/api/mattermost/channels");
    await Promise.all([first, second]);

    expect(chatApiPauseRemaining()).toBeGreaterThan(500_000);
  });

  it("supports HTTP-date Retry-After", async () => {
    const inTwoMinutes = new Date(Date.now() + 120_000).toUTCString();
    fetchMock.mockResolvedValue(mockResponse(429, { "Retry-After": inTwoMinutes }));

    await chatApiFetch("/api/mattermost/channels/unreads");

    expect(chatApiPauseRemaining()).toBeGreaterThan(100_000);
    expect(chatApiPauseRemaining()).toBeLessThanOrEqual(120_000);
  });

  it("honors Retry-After for the pause duration", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(mockResponse(429, { "Retry-After": "120" }));

    await chatApiFetch("/api/mattermost/channels/unreads");

    expect(chatApiPauseRemaining()).toBeLessThanOrEqual(120_000);
    expect(chatApiPauseRemaining()).toBeGreaterThan(110_000);
  });

  it("caps an oversized Retry-After", async () => {
    fetchMock.mockResolvedValue(mockResponse(429, { "Retry-After": "86400" }));

    await chatApiFetch("/api/mattermost/channels/unreads");

    expect(chatApiPauseRemaining()).toBeLessThanOrEqual(15 * 60_000);
  });

  it("resumes fetching after the pause expires", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(mockResponse(429, { "Retry-After": "60" }));

    await chatApiFetch("/api/mattermost/channels/unreads");
    await expect(chatApiFetch("/api/mattermost/channels")).rejects.toThrow(/paused/);

    vi.advanceTimersByTime(61_000);
    fetchMock.mockResolvedValue(mockResponse(200));

    const res = await chatApiFetch("/api/mattermost/channels");
    expect(res.status).toBe(200);
  });
});

describe("chatPollInterval", () => {
  beforeEach(() => {
    resetChatApiGuard();
  });

  it("returns the base interval for a healthy query", () => {
    expect(chatPollInterval(60_000, pollQuery("success"))).toBe(60_000);
    expect(chatPollInterval(60_000, pollQuery("pending"))).toBe(60_000);
  });

  it("backs off exponentially while the query errors", () => {
    expect(chatPollInterval(60_000, pollQuery("error", 1))).toBe(120_000);
    expect(chatPollInterval(60_000, pollQuery("error", 2))).toBe(240_000);
    expect(chatPollInterval(60_000, pollQuery("error", 3))).toBe(480_000);
  });

  it("treats an errored query with zero failure count as one failure", () => {
    expect(chatPollInterval(60_000, pollQuery("error", 0))).toBe(120_000);
  });

  it("caps the backoff at ten minutes", () => {
    expect(chatPollInterval(60_000, pollQuery("error", 10))).toBe(600_000);
  });

  it("grows across poll cycles even though fetchFailureCount resets each fetch", () => {
    // fetchFailureCount resets to 0 when a new fetch starts, so with
    // retry: false it is always 1 after a failed cycle. Consecutive failures
    // are derived from errorUpdateCount anchored at the last success.
    expect(chatPollInterval(60_000, pollQuery("success", 0, 5))).toBe(60_000);
    expect(chatPollInterval(60_000, pollQuery("error", 1, 6))).toBe(120_000);
    expect(chatPollInterval(60_000, pollQuery("error", 1, 7))).toBe(240_000);
    expect(chatPollInterval(60_000, pollQuery("error", 1, 8))).toBe(480_000);
    expect(chatPollInterval(60_000, pollQuery("error", 1, 9))).toBe(600_000);
    // Recovery resets the backoff
    expect(chatPollInterval(60_000, pollQuery("success", 0, 9))).toBe(60_000);
    expect(chatPollInterval(60_000, pollQuery("error", 1, 10))).toBe(120_000);
  });

  it("tracks failure streaks per query", () => {
    expect(chatPollInterval(60_000, pollQuery("error", 1, 4, "unreads"))).toBe(120_000);
    expect(chatPollInterval(60_000, pollQuery("error", 1, 5, "unreads"))).toBe(240_000);
    // A different query starts its own streak
    expect(chatPollInterval(60_000, pollQuery("error", 1, 9, "channels"))).toBe(120_000);
  });

  it("waits out an open pause even for a healthy query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(429, { "Retry-After": "300" }));
    vi.stubGlobal("fetch", fetchMock);
    await chatApiFetch("/api/mattermost/channels/unreads");
    vi.unstubAllGlobals();

    const interval = chatPollInterval(60_000, pollQuery("success"));
    expect(interval).toBeGreaterThan(290_000);
    expect(interval).toBeLessThanOrEqual(300_000);
  });
});
