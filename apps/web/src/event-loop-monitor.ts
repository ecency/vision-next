/**
 * Event loop lag monitor + stuck-loop watchdog.
 *
 * Background: the Next.js server runs on a single-threaded event loop. Any
 * synchronous CPU work (regex backtracking, huge JSON parsing, markdown
 * rendering, etc.) blocks ALL requests — including healthchecks. When that
 * happens the container can look completely dead even though Node is just
 * busy.
 *
 * The naïve approach — a setInterval on the main thread that samples event
 * loop delay — has a fatal flaw: when the loop is truly stuck, the interval
 * cannot fire, so the blocker is never logged. It only prints AFTER unblock
 * (or never, if the healthcheck kills the container first).
 *
 * Architecture here:
 *
 *   ┌────────────────────── main thread ──────────────────────┐
 *   │ diagnostics_channel → { start, finish } events          │
 *   │ per request, postMessage({start|end,id,method,url}) ──┐ │
 *   │ heartbeat every 100ms: postMessage({heartbeat,ts}) ───┤ │
 *   │ histogram monitorEventLoopDelay → post-unblock SPIKE  │ │
 *   └───────────────────────────────────────────────────────┼─┘
 *                                                           │
 *   ┌────────────────── watchdog worker ───────────────────┐ │
 *   │ own event loop, own setInterval(100ms)               │◄┘
 *   │ maintains parallel activeRequests map                │
 *   │ if (now - lastHeartbeat) > threshold:                │
 *   │   fs.writeSync(2, "STUCK ..." + activeRequests)      │
 *   │ on next heartbeat: writeSync "RECOVERED ..."         │
 *   └──────────────────────────────────────────────────────┘
 *
 * The worker runs on its own libuv event loop, completely independent of the
 * main thread. When the main thread blocks, the worker keeps ticking and
 * logs the URLs it last heard were in-flight. All output uses fs.writeSync
 * on fd 2 to bypass Node streams and guarantee flush — important because
 * stream-buffered output is lost when the container is SIGKILLed.
 *
 * Tuning (all via env, no rebuild):
 *   EVENT_LOOP_LAG_THRESHOLD_MS    — SPIKE threshold, default 1000
 *   EVENT_LOOP_STUCK_THRESHOLD_MS  — STUCK threshold (watchdog), default 500
 *   EVENT_LOOP_SAMPLE_INTERVAL_MS  — histogram sample window, default 1000
 *   EVENT_LOOP_SLOW_REQUEST_MS     — "slow" request threshold, default 500
 *   EVENT_LOOP_MONITOR_DISABLED    — set to "1" to disable entirely
 */

import diagnosticsChannel from "node:diagnostics_channel";
import fs from "node:fs";
import os from "node:os";
import { monitorEventLoopDelay } from "node:perf_hooks";
import { Worker } from "node:worker_threads";

type ActiveRequest = {
  id: number;
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

// Synchronous stderr write that bypasses Node's streams. Crucial: if the
// container is killed by the healthcheck before the async stream flushes,
// buffered output is lost. fs.writeSync(2, …) calls write(2) directly.
function writeStderrSync(line: string): void {
  try {
    fs.writeSync(2, line.endsWith("\n") ? line : line + "\n");
  } catch {
    // stderr closed — nothing we can do
  }
}

export function initEventLoopMonitor(): void {
  if (initialized) return;
  if (process.env.EVENT_LOOP_MONITOR_DISABLED === "1") return;
  if (!process.versions?.node) return;
  initialized = true;

  const lagThresholdMs = Number(process.env.EVENT_LOOP_LAG_THRESHOLD_MS ?? 1000);
  const stuckThresholdMs = Number(process.env.EVENT_LOOP_STUCK_THRESHOLD_MS ?? 500);
  const sampleIntervalMs = Number(process.env.EVENT_LOOP_SAMPLE_INTERVAL_MS ?? 1000);
  const slowRequestMs = Number(process.env.EVENT_LOOP_SLOW_REQUEST_MS ?? 500);

  const host =
    process.env.HOSTNAME ||
    process.env.HOST ||
    (typeof os.hostname === "function" ? os.hostname() : "unknown");
  const taskName = process.env.TASK_NAME || process.env.SERVICE_NAME;
  const containerTag = taskName ? `${taskName}@${host}` : host;

  // Inline watchdog worker source. Runs on its own event loop and is
  // therefore immune to main-thread stalls. Uses only require() (no
  // bundler involvement) and writes straight to stderr via write(2).
  const watchdogSource = `
    const { parentPort } = require("node:worker_threads");
    const fs = require("node:fs");

    const CONTAINER = ${JSON.stringify(containerTag)};
    const STUCK_MS = ${stuckThresholdMs};
    const CHECK_MS = 100;

    const active = new Map();
    let lastHeartbeat = Date.now();
    let stuckReportedAt = 0;

    function writeLine(line) {
      try { fs.writeSync(2, line + "\\n"); } catch (e) {}
    }

    parentPort.on("message", (msg) => {
      switch (msg.type) {
        case "start":
          active.set(msg.id, { method: msg.method, url: msg.url, startTime: msg.ts });
          break;
        case "end":
          active.delete(msg.id);
          break;
        case "heartbeat": {
          const prev = lastHeartbeat;
          lastHeartbeat = msg.ts;
          if (stuckReportedAt) {
            const stuckForMs = msg.ts - prev;
            writeLine("[EventLoopLag] RECOVERED " + JSON.stringify({
              container: CONTAINER,
              stuckForMs: stuckForMs
            }));
            stuckReportedAt = 0;
          }
          break;
        }
      }
    });

    setInterval(() => {
      const delta = Date.now() - lastHeartbeat;
      if (delta <= STUCK_MS) return;
      // Avoid spamming: only emit once per stall, then wait for recovery.
      if (stuckReportedAt) return;
      stuckReportedAt = Date.now();
      const now = Date.now();
      const snapshot = Array.from(active.values())
        .map(r => ({ method: r.method, url: r.url, durationMs: now - r.startTime }))
        .sort((a, b) => b.durationMs - a.durationMs)
        .slice(0, 10);
      writeLine("[EventLoopLag] STUCK " + JSON.stringify({
        container: CONTAINER,
        stuckForMs: delta,
        activeCount: active.size,
        active: snapshot
      }));
    }, CHECK_MS).unref();
  `;

  let worker: Worker | null = null;
  try {
    worker = new Worker(watchdogSource, { eval: true });
    worker.on("error", (err) => {
      writeStderrSync(`[EventLoopLag] watchdog worker error: ${err?.message || err}`);
    });
    worker.unref();
  } catch (err) {
    writeStderrSync(
      `[EventLoopLag] failed to start watchdog worker: ${(err as Error)?.message || err}`
    );
  }

  const postToWorker = (msg: Record<string, unknown>): void => {
    if (!worker) return;
    try {
      worker.postMessage(msg);
    } catch {
      // worker may be terminating
    }
  };

  let nextReqId = 0;

  const startChannel = diagnosticsChannel.channel("http.server.request.start");
  const finishChannel = diagnosticsChannel.channel("http.server.response.finish");

  startChannel.subscribe((message) => {
    const { request } = message as { request?: { method?: string; url?: string } };
    if (!request) return;
    const id = ++nextReqId;
    const entry: ActiveRequest = {
      id,
      method: request.method ?? "UNKNOWN",
      url: request.url ?? "unknown",
      startTime: Date.now()
    };
    activeRequests.set(request, entry);
    postToWorker({
      type: "start",
      id,
      method: entry.method,
      url: entry.url,
      ts: entry.startTime
    });
  });

  finishChannel.subscribe((message) => {
    const { request } = message as { request?: { method?: string; url?: string } };
    if (!request) return;
    const info = activeRequests.get(request);
    activeRequests.delete(request);
    if (!info) return;
    postToWorker({ type: "end", id: info.id });
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

  // Heartbeat: keeps the watchdog informed the main loop is alive.
  // When this stops firing, the watchdog fires the STUCK log.
  setInterval(() => {
    postToWorker({ type: "heartbeat", ts: Date.now() });
  }, 100).unref();

  // Histogram-based post-unblock SPIKE log. Still useful for milder
  // stalls that the watchdog's stuck threshold doesn't trigger on.
  const histogram = monitorEventLoopDelay({ resolution: 20 });
  histogram.enable();

  setInterval(() => {
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

      writeStderrSync(
        "[EventLoopLag] SPIKE " +
          JSON.stringify({
            container: containerTag,
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
  }, sampleIntervalMs).unref();

  writeStderrSync(
    `[EventLoopLag] monitor initialized container=${containerTag} ` +
      `(spikeThreshold=${lagThresholdMs}ms, stuckThreshold=${stuckThresholdMs}ms, ` +
      `interval=${sampleIntervalMs}ms, slowReq=${slowRequestMs}ms, watchdog=${worker ? "on" : "off"})`
  );
}
