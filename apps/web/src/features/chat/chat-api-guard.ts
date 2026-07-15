/**
 * Shared guard for chat polling requests.
 *
 * Two protections:
 * 1. `chatApiFetch` opens a module-wide pause when the edge answers 429, so
 *    every chat poller stops calling the API for the rate-limit window instead
 *    of hammering into it.
 * 2. `chatPollInterval` computes a failure-aware refetch interval: normal
 *    cadence while healthy, exponential backoff while the endpoint errors.
 *    A broken chat session or an origin incident must never turn the pollers
 *    into a request storm.
 */

const DEFAULT_PAUSE_MS = 10 * 60_000; // matches the edge rate-limit block window
const MAX_PAUSE_MS = 15 * 60_000;
const MAX_POLL_MS = 10 * 60_000;

let pausedUntil = 0;

export function chatApiPauseRemaining(now = Date.now()): number {
  return Math.max(0, pausedUntil - now);
}

/** Test-only helper. */
export function resetChatApiGuard(): void {
  pausedUntil = 0;
}

export async function chatApiFetch(input: string, init?: RequestInit): Promise<Response> {
  const remaining = chatApiPauseRemaining();
  if (remaining > 0) {
    throw new Error(`Chat API paused for ${Math.ceil(remaining / 1000)}s after rate limiting`);
  }

  const res = await fetch(input, init);

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After"));
    const pauseMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, MAX_PAUSE_MS)
        : DEFAULT_PAUSE_MS;
    pausedUntil = Date.now() + pauseMs;
  }

  return res;
}

export interface ChatPollQuery {
  state: {
    status: string;
    fetchFailureCount: number;
  };
}

/**
 * Failure-aware polling interval for React Query `refetchInterval` callbacks.
 * Healthy query -> `baseMs`. Erroring query -> `baseMs * 2^failures`, capped
 * at 10 minutes. While the guard pause is open, waits at least the remaining
 * pause so the next poll lands after the rate-limit window.
 */
export function chatPollInterval(baseMs: number, query: ChatPollQuery): number {
  const paused = chatApiPauseRemaining();
  if (paused > 0) {
    return Math.max(baseMs, paused);
  }

  if (query.state.status !== "error") {
    return baseMs;
  }

  const failures = Math.max(query.state.fetchFailureCount, 1);
  return Math.min(baseMs * Math.pow(2, failures), MAX_POLL_MS);
}
