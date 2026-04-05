/**
 * Event loop lag monitor.
 *
 * Background: The Next.js server runs on a single-threaded event loop. Any
 * synchronous CPU work (regex backtracking, huge JSON parsing, markdown
 * rendering, etc.) blocks ALL requests — including healthchecks. When that
 * happens the container can look completely dead even though Node is just
 * busy.
 *
 * This module:
 *   1. Samples the event-loop-delay histogram every SAMPLE_INTERVAL_MS.
 *   2. Tracks every in-flight HTTP request via Node's built-in
 *      `diagnostics_channel` (no monkey-patching, zero per-request code).
 *   3. When the delay in a window exceeds EVENT_LOOP_LAG_THRESHOLD_MS, it
 *      logs the URLs currently being processed and recently-finished slow
 *      requests — which is the list of suspects for whatever blocked the
 *      loop.
 *
 * Tuning (all via env, no rebuild):
 *   EVENT_LOOP_LAG_THRESHOLD_MS   — spike threshold, default 1000
 *   EVENT_LOOP_SAMPLE_INTERVAL_MS — sample window, default 1000
 *   EVENT_LOOP_SLOW_REQUEST_MS    — "slow" request threshold, default 500
 *   EVENT_LOOP_MONITOR_DISABLED   — set to "1" to disable entirely
 */

import diagnosticsChannel from "node:diagnostics_channel";
import { monitorEventLoopDelay } from "node:perf_hooks";

type ActiveRequest = {
  method: string;
  url: string;
  startTime: number;
};

type SlowRequest = {
  method: string;
  url: string;
  durationMs: number;
  finishedAt: number;
};

const activeRequests = new Map<object, ActiveRequest>();
const recentSlowRequests: SlowRequest[] = [];
const MAX_RECENT_SLOW = 20;

let initialized = false;

export function initEventLoopMonitor(): void {
  if (initialized) return;
  if (process.env.EVENT_LOOP_MONITOR_DISABLED === "1") return;
  if (!process.versions?.node) return;
  initialized = true;

  const lagThresholdMs = Number(process.env.EVENT_LOOP_LAG_THRESHOLD_MS ?? 1000);
  const sampleIntervalMs = Number(process.env.EVENT_LOOP_SAMPLE_INTERVAL_MS ?? 1000);
  const slowRequestMs = Number(process.env.EVENT_LOOP_SLOW_REQUEST_MS ?? 500);

  const startChannel = diagnosticsChannel.channel("http.server.request.start");
  const finishChannel = diagnosticsChannel.channel("http.server.response.finish");

  startChannel.subscribe((message) => {
    const { request } = message as { request?: { method?: string; url?: string } };
    if (!request) return;
    activeRequests.set(request, {
      method: request.method ?? "UNKNOWN",
      url: request.url ?? "unknown",
      startTime: Date.now()
    });
  });

  finishChannel.subscribe((message) => {
    const { request } = message as { request?: { method?: string; url?: string } };
    if (!request) return;
    const info = activeRequests.get(request);
    activeRequests.delete(request);
    if (!info) return;
    const durationMs = Date.now() - info.startTime;
    if (durationMs >= slowRequestMs) {
      recentSlowRequests.push({
        method: info.method,
        url: info.url,
        durationMs,
        finishedAt: Date.now()
      });
      if (recentSlowRequests.length > MAX_RECENT_SLOW) {
        recentSlowRequests.shift();
      }
    }
  });

  // Histogram resolution of 20ms keeps the monitor itself cheap while still
  // catching blocks in the hundreds-of-ms range.
  const histogram = monitorEventLoopDelay({ resolution: 20 });
  histogram.enable();

  const timer = setInterval(() => {
    const maxMs = histogram.max / 1e6;
    if (maxMs >= lagThresholdMs) {
      const now = Date.now();
      const active = Array.from(activeRequests.values())
        .map((r) => ({
          method: r.method,
          url: r.url,
          durationMs: now - r.startTime
        }))
        .sort((a, b) => b.durationMs - a.durationMs)
        .slice(0, 10);

      const recentSlow = recentSlowRequests
        .slice()
        .sort((a, b) => b.durationMs - a.durationMs)
        .slice(0, 10)
        .map((r) => ({
          method: r.method,
          url: r.url,
          durationMs: r.durationMs,
          agoMs: now - r.finishedAt
        }));

      const mem = process.memoryUsage();

      console.warn(
        "[EventLoopLag] SPIKE " +
          JSON.stringify({
            windowMs: sampleIntervalMs,
            maxMs: Math.round(maxMs),
            p99Ms: Math.round(histogram.percentile(99) / 1e6),
            meanMs: Math.round(histogram.mean / 1e6),
            rssMb: Math.round(mem.rss / 1024 / 1024),
            heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
            activeCount: activeRequests.size,
            active,
            recentSlow
          })
      );
    }
    histogram.reset();
  }, sampleIntervalMs);
  timer.unref();

  console.log(
    `[EventLoopLag] monitor initialized (threshold=${lagThresholdMs}ms, interval=${sampleIntervalMs}ms, slowReq=${slowRequestMs}ms)`
  );
}
