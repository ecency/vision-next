import { config } from '../config'
import { CallResponse } from '../types'
import type { APIMethods } from '../api-types'
import { sleep } from './sleep'

// ── Error Types ─────────────────────────────────────────────────────────────

export class RPCError extends Error {
  name = 'RPCError'
  data?: any
  code: number
  stack: undefined = undefined
  constructor(rpcError: { message: string; code: number; data?: any }) {
    super(rpcError.message)
    this.code = rpcError.code
    if ('data' in rpcError) {
      this.data = rpcError.data
    }
  }
}

/**
 * Transport-level error thrown by jsonRPCCall for HTTP status errors (429, 503).
 * Carries node identity and rate-limit info so callers can record health
 * exactly once without double-counting.
 */
class NodeError extends Error {
  node: string
  rateLimitMs: number
  constructor(node: string, message: string, rateLimitMs = 0) {
    super(message)
    this.node = node
    this.rateLimitMs = rateLimitMs
  }
}

/** Errors that indicate the request definitely never reached the server. */
const PRE_CONNECTION_ERRORS = ['ECONNREFUSED', 'ENOTFOUND', 'EHOSTUNREACH', 'EAI_AGAIN']

/** Browser fetch network-failure messages — emitted by Chromium/Firefox/Safari
 *  when CORS preflight fails, DNS fails, TLS fails, or the response is blocked.
 *  These map to scenarios where retrying the same signed broadcast is safe: the
 *  request either never reached the node, or its response was blocked but a
 *  re-broadcast of the *same* signed tx will be deduped by Hive (same trx_id). */
const BROWSER_NETWORK_ERRORS = [
  'Failed to fetch',                       // Chromium
  'NetworkError when attempting to fetch', // Firefox
  'Load failed',                           // Safari
  'fetch failed'                           // Node 18+ undici / Bun — also covered via cause chain
]

/**
 * Concatenate the error's surface text + the messages/codes from up to 5
 * levels of nested `cause`. Node.js fetch wraps connection failures as
 * `TypeError('fetch failed')` with the real `code` (ECONNREFUSED, etc.)
 * nested in the cause chain. Browser fetch failures have no cause but
 * carry their identifier in `message`.
 */
function flattenErrorText(e: any): string {
  if (!e) return ''
  const parts: string[] = [String(e.name || ''), String(e.message || ''), String(e.code || '')]
  let cause = e.cause
  for (let depth = 0; cause && depth < 5; depth++) {
    parts.push(String(cause.code || ''), String(cause.message || ''))
    cause = cause.cause
  }
  return parts.join(' ')
}

/**
 * Decide whether a broadcast attempt can safely be retried on another node.
 *
 * Safe to retry (same signed tx → Hive dedupes by trx_id at the mempool layer):
 *  - Pre-connection failures (ECONNREFUSED, ENOTFOUND, etc.) — request never sent.
 *  - Browser fetch network failures (CORS block, TLS error, DNS) — TypeError with
 *    a well-known message string.
 *  - JSON parse failures — node returned an HTML error page (typical for
 *    Cloudflare 1033 tunnel-down / 5xx interstitials), so the request never
 *    reached the Hive RPC layer.
 *  - NodeError (HTTP 429/5xx surfaced from jsonRPCCall) — already known transient.
 *
 * NOT safe to retry:
 *  - RPCError — the node accepted the request and the blockchain rejected it.
 *    Retrying on another node would either get the same rejection or accept
 *    a different one; surface the original error instead.
 */
function isBroadcastSafeToRetry(e: any): boolean {
  if (!e) return false
  if (e instanceof NodeError) return true
  if (e instanceof RPCError) return false

  const text = flattenErrorText(e)
  if (PRE_CONNECTION_ERRORS.some((code) => text.includes(code))) return true
  if (BROWSER_NETWORK_ERRORS.some((msg) => text.includes(msg))) return true

  // res.json() against an HTML body (Cloudflare/proxy interstitials) throws
  // SyntaxError. The Hive RPC layer never saw the tx, so failover is safe.
  if (e instanceof SyntaxError) return true
  // Some runtimes surface JSON parse errors as plain Error with this text.
  if (/Unexpected token|JSON\.parse|Unexpected end of JSON/i.test(text)) return true

  return false
}

// ── Node Health Tracker ─────────────────────────────────────────────────────

/** Node-level health state tracked by NodeHealthTracker. */
interface NodeHealth {
  /** Global consecutive-failure counter. Resets on success. */
  consecutiveFailures: number
  /** Timestamp of the most recent failure. Used with the 30s cooldown window. */
  lastFailureTime: number
  /** Epoch ms after which the node is no longer rate-limited. */
  rateLimitedUntil: number
  /** Per-API failure counters. Some nodes disable specific API plugins; tracking
   * per-API lets us deprioritize a node only for the APIs that fail, not globally. */
  apiFailures: Map<string, { count: number; cooldownUntil: number; lastFailureTime: number }>
  /** Most recent head_block_number observed for this node. */
  headBlock: number
  /** Epoch ms when the head_block was recorded. Used to expire stale observations. */
  headBlockUpdatedAt: number

  // ── Latency tracking (adaptive ordering) ────────────────────────────────
  /** EWMA of observed round-trip ms. Fed by successful calls AND by slow/timeout
   *  failures (so a node that returns 200 in 15s, or aborts at the timeout, is
   *  ranked on its real slowness — not treated as merely "healthy"). `undefined`
   *  until the first sample. */
  ewmaLatencyMs?: number
  /** Number of latency samples folded into the EWMA. Gates "warmup": below
   *  LATENCY_MIN_SAMPLES the node is unproven and keeps its config-order prior. */
  latencySampleCount: number
  /** Epoch ms of the most recent latency sample. Used for usability expiry and to
   *  decide when a node is overdue for an exploratory re-probe. */
  latencyUpdatedAt: number
  /** Epoch ms of the most recent exploratory promotion. Single-flight guard so a
   *  burst of concurrent orderings doesn't all re-probe the same stale node. */
  lastProbeAt: number
}

/**
 * JSON-RPC error codes that indicate the node itself is unhealthy, not that the
 * client sent a bad request. These should trigger failover to another node.
 *
 * Background: Hive nodes fronted by HAF/jussi/drone return HTTP 200 with a
 * JSON-RPC error body when a backing service (hivemind, postgrest, etc.) is down.
 * The HTTP layer looks healthy, so failover never triggers — the caller just gets
 * an error and gives up. This function identifies those node-level errors.
 */
function isNodeLevelRPCError(code: number, message: string): boolean {
  // -32603: Internal error — node is having problems
  if (code === -32603) return true
  // -32000 to -32099: Server error range (implementation-defined server errors)
  if (code <= -32000 && code >= -32099) return true
  // -32601: Method not found — node may be missing this API plugin
  if (code === -32601) return true
  // -32602 with node-sick indicators (vs normal "invalid params" from bad client input)
  // e.g. "Unable to parse endpoint data" from HAF when a backing service is down
  if (code === -32602 && /unable to parse|endpoint data|internal/i.test(message)) return true
  return false
}

/** Extract the API prefix from a method name like "rc_api.find_rc_accounts" -> "rc_api". */
function apiOf(method: string): string {
  const dot = method.indexOf('.')
  return dot > 0 ? method.slice(0, dot) : method
}

/** Per-API failure threshold before the node is deprioritized for that API only. */
const MAX_API_FAILURES_BEFORE_COOLDOWN = 2
/** How long a node stays deprioritized for a specific API after repeated failures. */
const API_COOLDOWN_MS = 60_000
/** How long head_block observations remain valid before being treated as unknown. */
const HEAD_BLOCK_MAX_AGE_MS = 120_000
/** Maximum lag (in blocks) before a node is considered stale relative to the best-known head. */
const STALE_BLOCK_THRESHOLD = 30

// ── Adaptive latency-ordering constants ──────────────────────────────────────
/** EWMA smoothing weight for a new latency sample. 0.3 ⇒ ~5–6 samples to converge;
 *  absorbs one-off GC/TLS spikes while still reacting to a real regional shift fast. */
const LATENCY_EWMA_ALPHA = 0.3
/** Samples required before a node's latency is trusted for ranking. Below this the
 *  node is "warming" and ranks at a neutral prior (config order via tiebreak), so a
 *  single fluke never reorders the list and cold start == today's behavior. */
const LATENCY_MIN_SAMPLES = 3
/** How long a latency sample stays usable for ranking. Past this a node reverts to
 *  warming. Must be > LATENCY_REPROBE_MS so re-probes keep a busy node's profile fresh. */
const LATENCY_MAX_AGE_MS = 5 * 60_000
/** A healthy node not sampled within this window is overdue for an exploratory
 *  re-probe (promoted to front of ONE ordering). This is what lets a demoted node
 *  climb back when it recovers — and what profiles a node that organic traffic never
 *  reaches. 60s ⇒ ~1 probe/node/min worst case = negligible cost. */
const LATENCY_REPROBE_MS = 60_000
/** Neutral score (ms) for an unproven/warming node: optimistic enough to sit ahead
 *  of a proven-slow node (so we explore an unknown before hammering a known-slow one)
 *  but behind a proven-fast node. Fixed, so a node makes at most ONE rank transition
 *  when it crosses LATENCY_MIN_SAMPLES — no churn. */
const LATENCY_UNPROVEN_PRIOR_MS = 1_000
/** A failed call only feeds a latency penalty if it was actually slow (≥ this). Keeps
 *  a genuine timeout / slow-5xx (the hapi-from-US case) visible to the ranker while an
 *  instant ECONNREFUSED (a *down* node, handled by consecutiveFailures) is NOT mis-read
 *  as "slow". The penalty value is the *measured* elapsed, never a static constant. */
const LATENCY_SLOW_FAILURE_MS = 2_000
/** Our-node additive tolerance (ms): our own unlimited node (no public rate limit via
 *  fleet IP whitelist) is forgiven up to this much extra latency, so it keeps its slot
 *  when it's merely a little slower than a public peer. ~700ms covers the normal
 *  EU/SIN advantage envelope. */
const OUR_NODE_BIAS_MS = 700
/** Hard ceiling on the bias: once our node is this many× the fastest proven peer, the
 *  forgiveness is dropped and it ranks on raw latency. Guarantees our node CAN be
 *  demoted when it's genuinely slow (US 6–20s) instead of being pinned #1 forever. */
const OUR_NODE_DEMOTE_RATIO = 2.5

/** Hosts we operate (no public rate limit). Biased so the fleet prefers its own
 *  unlimited node where it is fast, and only steps off it when it is genuinely slow.
 *  Matched by hostname so a path/trailing-slash can't defeat it. */
const OUR_NODE_HOSTS = new Set(['hapi.ecency.com', 'api.ecency.com'])
function isOurNode(node: string): boolean {
  try {
    return OUR_NODE_HOSTS.has(new URL(node).hostname)
  } catch {
    return false
  }
}

/** @internal Exported for testing only. */
export class NodeHealthTracker {
  private health = new Map<string, NodeHealth>()

  private getOrCreate(node: string): NodeHealth {
    let h = this.health.get(node)
    if (!h) {
      h = {
        consecutiveFailures: 0,
        lastFailureTime: 0,
        rateLimitedUntil: 0,
        apiFailures: new Map(),
        headBlock: 0,
        headBlockUpdatedAt: 0,
        ewmaLatencyMs: undefined,
        latencySampleCount: 0,
        latencyUpdatedAt: 0,
        lastProbeAt: 0
      }
      this.health.set(node, h)
    }
    return h
  }

  recordSuccess(node: string, api?: string, durationMs?: number): void {
    const h = this.getOrCreate(node)
    h.consecutiveFailures = 0
    if (api) {
      // A successful API call clears that API's failure counter.
      h.apiFailures.delete(api)
    }
    if (typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs >= 0) {
      this.recordLatency(h, durationMs)
    }
  }

  /**
   * Record a *slow* failed call as a latency signal. The failure counters are
   * updated separately (recordFailure/recordError); this only feeds the EWMA so a
   * node that returns 200-but-too-slow, times out, or returns a slow 5xx is ranked
   * on its real slowness. Callers pass the MEASURED elapsed ms and only call this
   * when the call was genuinely slow (≥ LATENCY_SLOW_FAILURE_MS) — an instant
   * connection failure (a *down* node) must NOT look "slow".
   */
  recordSlowFailure(node: string, durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs < LATENCY_SLOW_FAILURE_MS) return
    this.recordLatency(this.getOrCreate(node), durationMs)
  }

  /** Fold a latency sample into the node's EWMA (warmup + usability bookkeeping). */
  private recordLatency(h: NodeHealth, durationMs: number): void {
    const now = Date.now()
    // A profile older than the usable window starts fresh, so an idled process
    // re-learns from scratch rather than ranking on hour-old data.
    if (h.latencyUpdatedAt > 0 && now - h.latencyUpdatedAt > LATENCY_MAX_AGE_MS) {
      h.ewmaLatencyMs = undefined
      h.latencySampleCount = 0
    }
    h.ewmaLatencyMs =
      h.ewmaLatencyMs === undefined
        ? durationMs
        : LATENCY_EWMA_ALPHA * durationMs + (1 - LATENCY_EWMA_ALPHA) * h.ewmaLatencyMs
    h.latencySampleCount++
    h.latencyUpdatedAt = now
  }

  recordFailure(node: string, api?: string): void {
    const h = this.getOrCreate(node)
    if (api) {
      // API-specific failure: only update the per-API tracker.
      // This prevents e.g. 3 rc_api failures from marking the node
      // globally unhealthy for condenser_api too.
      const now = Date.now()
      const existing: { count: number; cooldownUntil: number; lastFailureTime: number } =
        h.apiFailures.get(api) ?? { count: 0, cooldownUntil: 0, lastFailureTime: 0 }
      // Reset counter if previous cooldown expired OR last failure was >30s ago
      // (avoids sticky penalties from sparse failures hours apart)
      if (
        (existing.cooldownUntil > 0 && existing.cooldownUntil <= now) ||
        (existing.lastFailureTime > 0 && now - existing.lastFailureTime > 30_000)
      ) {
        existing.count = 0
        existing.cooldownUntil = 0
      }
      existing.count++
      existing.lastFailureTime = now
      if (existing.count >= MAX_API_FAILURES_BEFORE_COOLDOWN) {
        existing.cooldownUntil = now + API_COOLDOWN_MS
      }
      h.apiFailures.set(api, existing)
    } else {
      // Transport-level failure (no specific API): update global counter
      h.consecutiveFailures++
      h.lastFailureTime = Date.now()
    }
  }

  recordRateLimit(node: string, retryAfterMs = 10_000): void {
    const h = this.getOrCreate(node)
    h.rateLimitedUntil = Date.now() + retryAfterMs
    h.consecutiveFailures++
    h.lastFailureTime = Date.now()
  }

  /** Record an observed head_block_number for this node. */
  recordHeadBlock(node: string, blockNum: number): void {
    if (!blockNum || !Number.isFinite(blockNum)) return
    const h = this.getOrCreate(node)
    h.headBlock = blockNum
    h.headBlockUpdatedAt = Date.now()
  }

  /**
   * Consensus head block from recent observations. Uses the median rather than the
   * max to prevent a single bad/misconfigured node from poisoning the reference.
   * A node reporting an inflated head_block won't affect the median unless the
   * majority of nodes agree on that range.
   */
  private consensusHeadBlock(): number {
    const now = Date.now()
    const recent: number[] = []
    for (const h of this.health.values()) {
      if (h.headBlock > 0 && now - h.headBlockUpdatedAt <= HEAD_BLOCK_MAX_AGE_MS) {
        recent.push(h.headBlock)
      }
    }
    if (recent.length < 2) return 0 // Need at least 2 observations to compare
    recent.sort((a, b) => a - b)
    // Median: for even length, use the lower-middle value (conservative)
    return recent[Math.floor((recent.length - 1) / 2)]
  }

  /** True if this node is healthy (globally and for the given API if provided). */
  isNodeHealthy(node: string, api?: string): boolean {
    const h = this.health.get(node)
    if (!h) return true // unknown nodes assumed healthy
    const now = Date.now()

    // Rate-limited and cooldown hasn't expired
    if (h.rateLimitedUntil > now) return false

    // Too many consecutive failures within the last 30 seconds
    if (h.consecutiveFailures >= 3 && now - h.lastFailureTime < 30_000) return false

    // Per-API cooldown: node may be healthy overall but missing this API plugin
    if (api) {
      const apiFail = h.apiFailures.get(api)
      if (apiFail && apiFail.cooldownUntil > now) return false
    }

    // Head-block staleness: deprioritize nodes lagging behind the consensus head
    const best = this.consensusHeadBlock()
    if (
      best > 0 &&
      h.headBlock > 0 &&
      now - h.headBlockUpdatedAt <= HEAD_BLOCK_MAX_AGE_MS &&
      best - h.headBlock > STALE_BLOCK_THRESHOLD
    ) {
      return false
    }

    return true
  }

  /**
   * Order nodes best-first: healthy nodes sorted by adaptive latency score, then
   * unhealthy nodes appended. Capability / staleness / rate-limit filtering stays in
   * `isNodeHealthy` and is unchanged — latency only reorders WITHIN the healthy set,
   * and only WITHIN the array it is handed (so it never leaves the configured list).
   *
   * One ordering per pass MAY promote a healthy node overdue for a re-probe (never
   * sampled, or not sampled within LATENCY_REPROBE_MS) to the front — single-flight
   * via `lastProbeAt`. This is what lets a demoted node climb back when it recovers,
   * and profiles a node that organic traffic (always served by a faster peer) never
   * reaches. Cold start: with no profiles, every node scores the neutral prior and the
   * stable config-index tiebreak yields the original order — i.e. today's behavior.
   */
  getOrderedNodes(nodes: string[], api?: string): string[] {
    const healthy: string[] = []
    const unhealthy: string[] = []
    for (const node of nodes) {
      if (this.isNodeHealthy(node, api)) {
        healthy.push(node)
      } else {
        unhealthy.push(node)
      }
    }
    if (healthy.length <= 1) {
      return [...healthy, ...unhealthy]
    }
    const now = Date.now()
    const fastest = this.fastestUsableLatency(healthy, now)
    // Every score in THIS pass is computed against the same `fastest` and falls back
    // to config index on ties → a total, transitive order with no memo (so no
    // stale-denominator inversions).
    const ordered = healthy
      .map((node, i) => ({ node, i, score: this.scoreNode(node, fastest, now) }))
      .sort((a, b) => a.score - b.score || a.i - b.i)
      .map((d) => d.node)
    const probe = this.pickReprobeCandidate(healthy, now)
    if (probe && ordered[0] !== probe) {
      return [probe, ...ordered.filter((n) => n !== probe), ...unhealthy]
    }
    return [...ordered, ...unhealthy]
  }

  /** A node's latency is usable for ranking only if profiled (≥ MIN_SAMPLES) and fresh. */
  private isLatencyUsable(h: NodeHealth | undefined, now: number): boolean {
    return (
      !!h &&
      h.ewmaLatencyMs !== undefined &&
      h.latencySampleCount >= LATENCY_MIN_SAMPLES &&
      now - h.latencyUpdatedAt <= LATENCY_MAX_AGE_MS
    )
  }

  /** Fastest usable EWMA among the given nodes; Infinity if none is profiled yet. */
  private fastestUsableLatency(nodes: string[], now: number): number {
    let min = Infinity
    for (const n of nodes) {
      const h = this.health.get(n)
      if (this.isLatencyUsable(h, now)) min = Math.min(min, h!.ewmaLatencyMs!)
    }
    return min
  }

  /**
   * Ranking score (lower = better). Unproven/warming nodes get a fixed neutral prior
   * so they sit ahead of a proven-slow node but behind a proven-fast one, and make at
   * most one rank transition when they cross MIN_SAMPLES (no churn). Our own node is
   * forgiven OUR_NODE_BIAS_MS of extra latency — bounded by OUR_NODE_DEMOTE_RATIO so it
   * is genuinely demoted when slow rather than pinned #1.
   */
  private scoreNode(node: string, fastest: number, now: number): number {
    const h = this.health.get(node)
    if (!this.isLatencyUsable(h, now)) return LATENCY_UNPROVEN_PRIOR_MS
    const lat = h!.ewmaLatencyMs!
    if (isOurNode(node)) {
      const overCeiling =
        fastest > 0 && fastest !== Infinity && lat > OUR_NODE_DEMOTE_RATIO * fastest
      if (overCeiling) return lat // demoted: raw latency, no forgiveness
      return Math.max(lat - OUR_NODE_BIAS_MS, 0)
    }
    return lat
  }

  /**
   * At most one healthy node overdue for an exploratory re-probe: never sampled, or
   * neither sampled nor re-probed within LATENCY_REPROBE_MS. Returns the stalest such
   * node and stamps `lastProbeAt` to single-flight it against concurrent orderings.
   */
  private pickReprobeCandidate(healthy: string[], now: number): string | undefined {
    const threshold = now - LATENCY_REPROBE_MS
    let cand: string | undefined
    let candTouch = Infinity
    for (const n of healthy) {
      const h = this.getOrCreate(n)
      const touch = Math.max(h.latencyUpdatedAt, h.lastProbeAt)
      if (touch <= threshold && touch < candTouch) {
        cand = n
        candTouch = touch
      }
    }
    if (cand) this.getOrCreate(cand).lastProbeAt = now
    return cand
  }
}

const rpcHealthTracker = new NodeHealthTracker()
const restHealthTracker = new NodeHealthTracker()

// ── Internal helpers ────────────────────────────────────────────────────────

/** Record a caught error on the health tracker (handles NodeError to avoid double-counting). */
function recordError(tracker: NodeHealthTracker, node: string, e: any, api?: string): void {
  if (e instanceof NodeError) {
    if (e.rateLimitMs > 0) {
      tracker.recordRateLimit(node, e.rateLimitMs)
    } else {
      tracker.recordFailure(node, api)
    }
  } else if (e instanceof RPCError) {
    // RPC-level errors are API-specific (e.g., disabled API)
    tracker.recordFailure(node, api)
  } else {
    // Transport-level failures (DNS, TLS, timeout) affect the whole node
    tracker.recordFailure(node)
  }
}

/**
 * Passively extract head_block_number from known RPC responses
 * (e.g. `condenser_api.get_dynamic_global_properties`, `database_api.get_dynamic_global_properties`).
 * Silently ignores responses without that shape.
 */
function tryRecordHeadBlock(
  tracker: NodeHealthTracker,
  node: string,
  method: string,
  result: any
): void {
  if (!result || typeof result !== 'object') return
  if (!method.includes('get_dynamic_global_properties')) return
  const block = (result as any).head_block_number
  if (typeof block === 'number') {
    tracker.recordHeadBlock(node, block)
  }
}

// ── AbortSignal helpers (browser fallbacks) ─────────────────────────────────

/**
 * Build a TimeoutError "reason" for an aborted signal.
 * Prefers the standard `DOMException` when available. Runtimes that ship
 * `AbortController` without `DOMException` (notably React Native / Hermes,
 * old Node < 17) fall back to a plain Error tagged with `name: 'TimeoutError'`
 * — which is what consumers actually check on `signal.reason`.
 */
function createTimeoutReason(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('The operation was aborted due to timeout', 'TimeoutError')
  }
  const err = new Error('The operation was aborted due to timeout')
  err.name = 'TimeoutError'
  return err
}

/** AbortSignal.timeout polyfill for pre-Chrome 103 / pre-Safari 16.4.
 *  Returns { signal, cleanup } — caller must invoke cleanup() on success
 *  to clear the dangling timer. */
function createTimeoutSignal(ms: number): { signal: AbortSignal; cleanup: () => void } {
  if (typeof AbortSignal.timeout === 'function') {
    return { signal: AbortSignal.timeout(ms), cleanup: () => {} }
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(createTimeoutReason()), ms)
  return { signal: controller.signal, cleanup: () => clearTimeout(timer) }
}

/** AbortSignal.any polyfill for pre-Chrome 116 / pre-Safari 17.4.
 *  Returns { signal, cleanup } — caller must invoke cleanup() on success
 *  to remove listeners from the input signals (prevents leaks when the
 *  same long-lived signal is reused across many callRPC invocations). */
function mergeSignals(
  primary: AbortSignal,
  secondary?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } {
  if (!secondary) return { signal: primary, cleanup: () => {} }
  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any([primary, secondary]), cleanup: () => {} }
  }
  // Fallback: controller that aborts with the winning signal's reason
  const controller = new AbortController()
  if (primary.aborted) {
    controller.abort(primary.reason)
    return { signal: controller.signal, cleanup: () => {} }
  }
  if (secondary.aborted) {
    controller.abort(secondary.reason)
    return { signal: controller.signal, cleanup: () => {} }
  }

  const onPrimaryAbort = () => controller.abort(primary.reason)
  const onSecondaryAbort = () => controller.abort(secondary.reason)
  primary.addEventListener('abort', onPrimaryAbort, { once: true })
  secondary.addEventListener('abort', onSecondaryAbort, { once: true })

  const cleanup = () => {
    primary.removeEventListener('abort', onPrimaryAbort)
    secondary.removeEventListener('abort', onSecondaryAbort)
  }
  return { signal: controller.signal, cleanup }
}

/**
 * Low-level JSON-RPC call to a single node. No failover.
 * Throws RPCError for blockchain rejections, NodeError for HTTP 429/5xx,
 * and generic Error for other transport failures.
 * @param shouldRetry - If true, retries once on the same node for transient errors.
 */
const jsonRPCCall = async (
  url: string,
  method: string,
  params: any,
  timeout = config.timeout,
  shouldRetry = false,
  externalSignal?: AbortSignal
) => {
  const id = Math.floor(Math.random() * 100_000_000)
  const body = {
    jsonrpc: '2.0',
    method,
    params,
    id
  }
  // Merge the per-call timeout with any external abort signal (e.g., SSR
  // request cancellation). Either one firing cancels the fetch.
  // Fallbacks for browsers without AbortSignal.timeout (pre-Chrome 103)
  // or AbortSignal.any (pre-Chrome 116).
  const { signal: tSignal, cleanup: cleanupTimeout } = createTimeoutSignal(timeout)
  const { signal, cleanup: cleanupMerge } = mergeSignals(tSignal, externalSignal)
  const cleanup = () => {
    cleanupTimeout()
    cleanupMerge()
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      signal
    })

    // Handle HTTP-level errors before parsing JSON.
    // Throw NodeError so callers can record health exactly once.
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After')
      const cooldownMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10_000
      throw new NodeError(url, `HTTP 429 Rate Limited`, cooldownMs)
    }
    // Any other 5xx is a node-level failure. Common cases:
    //   502 Bad Gateway       — upstream HAF/jussi down
    //   503 Service Unavail   — node draining / maintenance
    //   504 Gateway Timeout   — slow upstream
    //   520-530               — Cloudflare interstitials (1033 tunnel error → 530)
    // Without this branch, the HTML error-page body would fall into res.json()
    // and throw a generic SyntaxError downstream, making failover guess at
    // whether the request reached the node.
    if (res.status >= 500 && res.status < 600) {
      throw new NodeError(url, `HTTP ${res.status} from ${url}`)
    }

    const result = (await res.json()) as CallResponse
    if (
      !result ||
      typeof result.id === 'undefined' ||
      result.id !== id ||
      result.jsonrpc !== '2.0'
    ) {
      throw new Error('JSONRPC id mismatch')
    }
    if ('result' in result) {
      return result.result
    }
    if ('error' in result) {
      const e = result.error
      if ('message' in e && 'code' in e) {
        throw new RPCError(e)
      }
      throw result.error
    }
    // No result and no error?
    throw result
  } catch (e) {
    if (e instanceof RPCError) {
      throw e
    }
    // NodeError should not be retried on the same node - it's an HTTP status issue
    if (e instanceof NodeError) {
      throw e
    }
    if (externalSignal?.aborted) {
      throw e
    }
    if (shouldRetry) {
      return jsonRPCCall(url, method, params, timeout, false, externalSignal)
    }
    throw e
  } finally {
    cleanup()
  }
}

/** Small jitter delay between failover attempts to prevent thundering herd. */
function jitterDelay(): Promise<void> {
  return sleep(50 + Math.random() * 50)
}

// ── Public API: callRPC ─────────────────────────────────────────────────────

/**
 * Makes API calls to Hive blockchain nodes with automatic retry and failover support.
 * Uses per-request retry counters, node health tracking, jitter between retries,
 * and HTTP status awareness (429 rate limiting, 503).
 *
 * If the current node fails, it will automatically try the next healthy node.
 * When all nodes have been tried, wraps around to give earlier nodes another chance
 * until the full retry budget (config.retry) is exhausted.
 * RPCErrors (valid blockchain rejections) are never retried.
 *
 * @param method - The API method name (e.g., 'condenser_api.get_accounts')
 * @param params - Parameters for the API method as array or object
 * @param timeout - Request timeout in milliseconds (default: config.timeout)
 * @param retry - Maximum number of retry attempts (default: config.retry)
 * @returns Promise resolving to the API response
 * @throws {RPCError} On blockchain-level errors (bad params, missing authority, etc.)
 * @throws {Error} If all retry attempts fail
 *
 * @example
 * ```typescript
 * import { callRPC } from 'hive-tx'
 *
 * // Get account information
 * const accounts = await callRPC('condenser_api.get_accounts', [['alice']])
 *
 * // Custom timeout and retry settings
 * const data = await callRPC('condenser_api.get_content', ['alice', 'test-post'], 10_000, 5)
 * ```
 */
export const callRPC = async <T = any>(
  method: string,
  params: any[] | object = [],
  timeout = config.timeout,
  retry = config.retry,
  signal?: AbortSignal
): Promise<T> => {
  if (!Array.isArray(config.nodes)) {
    throw new Error('config.nodes is not an array')
  }
  if (config.nodes.length === 0) {
    throw new Error('config.nodes is empty')
  }
  const api = apiOf(method)
  // Track nodes tried in the current round. When all nodes have been tried,
  // clear the set to allow a second round (wrap-around) using the retry budget.
  const triedInRound = new Set<string>()
  let lastError: any

  for (let attempt = 0; attempt <= retry; attempt++) {
    // Re-evaluate node order each attempt so health changes are respected.
    // Pass api so nodes with an API-specific cooldown are deprioritized.
    const orderedNodes = rpcHealthTracker.getOrderedNodes(config.nodes, api)
    // Pick the healthiest untried node. If all tried, start a new round.
    let node = orderedNodes.find((n) => !triedInRound.has(n))
    if (!node) {
      triedInRound.clear()
      node = orderedNodes[0]
    }
    triedInRound.add(node)
    const callStart = Date.now()
    try {
      const res = await jsonRPCCall(node, method, params, timeout, false, signal)
      rpcHealthTracker.recordSuccess(node, api, Date.now() - callStart)
      tryRecordHeadBlock(rpcHealthTracker, node, method, res)
      return res as T
    } catch (e: any) {
      // RPCErrors: distinguish node-level failures from genuine blockchain rejections.
      // Node-level errors (e.g. -32602 "Unable to parse endpoint data" from a sick
      // HAF/jussi backend) should failover; real rejections (bad params, missing
      // authority, etc.) propagate immediately.
      if (e instanceof RPCError) {
        if (!isNodeLevelRPCError(e.code, e.message)) {
          throw e
        }
        // Node-level RPC error — record failure and fall through to failover
      }
      // External abort — stop retrying immediately
      if (signal?.aborted) {
        throw e
      }
      recordError(rpcHealthTracker, node, e, api)
      // A genuinely slow failure (timeout/abort/slow-5xx) is also a latency signal so
      // a node that 200s-but-too-slow or aborts at the timeout is demoted by the
      // ranker, not only by the (transient) failure gate. Measured elapsed, never a
      // constant; recordSlowFailure ignores instant (down-node) failures.
      rpcHealthTracker.recordSlowFailure(node, Date.now() - callStart)
      lastError = e

      // Add jitter before trying next node
      if (attempt < retry) {
        await jitterDelay()
      }
    }
  }

  throw lastError
}

// ── Public API: callRPC for broadcasts ──────────────────────────────────────

/**
 * Broadcast-safe RPC call. Only retries on pre-connection errors where the
 * request definitively never reached the server (ECONNREFUSED, ENOTFOUND, etc.).
 * On timeouts, HTTP errors, or any ambiguous failure, throws immediately to
 * prevent double-broadcasting transactions.
 *
 * Tries each node once (no wrap-around) since broadcast retries are dangerous.
 *
 * @internal Used by Transaction.broadcast()
 */
export const callRPCBroadcast = async <T = any>(
  method: string,
  params: any[] | object = [],
  timeout = config.broadcastTimeout,
  signal?: AbortSignal
): Promise<T> => {
  if (!Array.isArray(config.nodes)) {
    throw new Error('config.nodes is not an array')
  }
  if (config.nodes.length === 0) {
    throw new Error('config.nodes is empty')
  }
  const api = apiOf(method)
  // Track which nodes we've already tried - broadcasts must never retry the same node
  const triedNodes = new Set<string>()
  let lastError: any

  for (let attempt = 0; attempt < config.nodes.length; attempt++) {
    // Re-evaluate order each attempt so health changes are respected
    const orderedNodes = rpcHealthTracker.getOrderedNodes(config.nodes, api)
    const node = orderedNodes.find((n) => !triedNodes.has(n))
    if (!node) break
    triedNodes.add(node)
    if (signal?.aborted) {
      throw new Error('Aborted')
    }
    try {
      const res = await jsonRPCCall(node, method, params, timeout, false, signal)
      rpcHealthTracker.recordSuccess(node, api)
      return res as T
    } catch (e: any) {
      // RPCErrors are valid blockchain rejections - never retry
      if (e instanceof RPCError) {
        throw e
      }
      if (signal?.aborted) {
        throw e
      }
      recordError(rpcHealthTracker, node, e, api)
      lastError = e

      // Broadcast safety: only fail over when the request is safe to re-send.
      // `broadcastOperations` signs the tx exactly once and `callRPCBroadcast`
      // reuses that signed payload across nodes, so any case where the next
      // node would dedupe by trx_id is fine. RPCErrors (real blockchain
      // rejections) propagate immediately — see isBroadcastSafeToRetry.
      if (!isBroadcastSafeToRetry(e)) {
        throw e
      }
    }
  }

  throw lastError
}

// ── Public API: callREST ────────────────────────────────────────────────────

const apiMethods: Record<APIMethods, string> = {
  balance: '/balance-api',
  hafah: '/hafah-api',
  hafbe: '/hafbe-api',
  hivemind: '/hivemind-api',
  hivesense: '/hivesense-api',
  reputation: '/reputation-api',
  'nft-tracker': '/nft-tracker-api',
  hafsql: '/hafsql',
  status: '/status-api'
}

/**
 * Makes REST API calls to Hive blockchain REST endpoints with automatic retry and failover support.
 * Uses per-request retry counters, node health tracking, and timeout support.
 * Wraps around the node list to honor the full retry budget.
 *
 * @template Api - The REST API method type (e.g., 'balance', 'hafah', 'hivemind', etc.)
 * @template P - The endpoint path type for the specified API
 *
 * @param api - The REST API method name to call
 * @param endpoint - The specific endpoint path within the API
 * @param params - Optional parameters for path and query string replacement
 * @param timeout - Request timeout in milliseconds (default: config.timeout)
 * @param retry - Number of retry attempts before throwing an error (default: config.retry)
 *
 * @returns Promise resolving to the API response data with proper typing
 * @throws Error if all retry attempts fail
 *
 * @example
 * ```typescript
 * import { callREST } from 'hive-tx'
 *
 * // Get account balance
 * const balance = await callREST('balance', '/accounts/{account-name}/balances', { "account-name": 'alice' })
 *
 * // Custom timeout and retry settings
 * const data = await callREST('status', '/status', undefined, 10_000, 3)
 * ```
 */
export async function callREST(
  api: APIMethods,
  endpoint: string,
  params?: Record<string, any>,
  timeout = config.timeout,
  retry = config.retry,
  signal?: AbortSignal
): Promise<any> {
  if (!Array.isArray(config.restNodes)) {
    throw new Error('config.restNodes is not an array')
  }
  if (config.restNodes.length === 0) {
    throw new Error('config.restNodes is empty')
  }
  // Per-API node override: an API served by only a subset of nodes (e.g.
  // hivesense) uses its own capable-host list so the small retry budget and
  // cold starts aren't wasted on nodes that 404/503 it. Any API without an
  // override (or with an empty one) falls back to the generic restNodes.
  const apiNodes =
    config.restNodesByApi?.[api]?.length
      ? config.restNodesByApi[api]!
      : config.restNodes
  const triedInRound = new Set<string>()
  let lastError: any
  // Track whether the error was already recorded by the HTTP status handler
  let alreadyRecorded = false

  for (let attempt = 0; attempt <= retry; attempt++) {
    // Re-evaluate node order each attempt so health changes are respected.
    // Pass api so per-API cooldowns are respected.
    const orderedNodes = restHealthTracker.getOrderedNodes(apiNodes, api)
    let node = orderedNodes.find((n) => !triedInRound.has(n))
    if (!node) {
      triedInRound.clear()
      node = orderedNodes[0]
    }
    triedInRound.add(node)
    const baseUrl = node + apiMethods[api]
    let path = endpoint as string
    const paramObj = params || ({} as Record<string, any>)
    const processedPathParams = new Set<string>()

    // Replace path params ONLY
    Object.entries(paramObj).forEach(([key, value]) => {
      if (path.includes(`{${key}}`)) {
        path = path.replace(`{${key}}`, encodeURIComponent(String(value)))
        processedPathParams.add(key)
      }
    })
    const url = new URL(baseUrl + path)
    // Add ONLY remaining params as query (if any)
    Object.entries(paramObj).forEach(([key, value]) => {
      if (!processedPathParams.has(key)) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)))
        } else {
          url.searchParams.set(key, String(value))
        }
      }
    })

    if (signal?.aborted) {
      throw new Error('Aborted')
    }
    alreadyRecorded = false
    const { signal: tSignal, cleanup: cleanupTimeout } = createTimeoutSignal(timeout)
    const { signal: restSignal, cleanup: cleanupMerge } = mergeSignals(tSignal, signal)
    const restCleanup = () => { cleanupTimeout(); cleanupMerge() }
    const restCallStart = Date.now()
    try {
      const response = await fetch(url.toString(), {
        signal: restSignal
      })
      if (response.status === 404) {
        throw new Error('HTTP 404 - Hint: can happen on wrong params')
      }
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const cooldownMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10_000
        restHealthTracker.recordRateLimit(node, cooldownMs)
        alreadyRecorded = true
        throw new Error(`HTTP 429 Rate Limited by ${node}`)
      }
      if (response.status === 503) {
        restHealthTracker.recordFailure(node, api)
        alreadyRecorded = true
        throw new Error(`HTTP 503 Service Unavailable from ${node}`)
      }
      if (!response.ok) {
        restHealthTracker.recordFailure(node, api)
        alreadyRecorded = true
        throw new Error(`HTTP ${response.status} from ${node}`)
      }
      restHealthTracker.recordSuccess(node, api, Date.now() - restCallStart)
      return response.json() as any
    } catch (e: any) {
      // 404 is not a node issue, don't failover
      if (e?.message?.includes('HTTP 404')) {
        throw e
      }
      // Only record if not already recorded by 429/503 handler above
      if (!alreadyRecorded) {
        restHealthTracker.recordFailure(node, api)
      }
      // A slow failure (timeout/abort/slow-5xx — e.g. hapi from a far region) is a
      // latency signal too, so it is demoted by the ranker, not only the failure gate.
      // Measured elapsed; recordSlowFailure floors at LATENCY_SLOW_FAILURE_MS so a fast
      // 404/429 or instant down-node failure is NOT mis-read as "slow".
      restHealthTracker.recordSlowFailure(node, Date.now() - restCallStart)
      lastError = e

      if (attempt < retry) {
        await jitterDelay()
      }
    } finally {
      restCleanup()
    }
  }

  throw lastError
}

// ── Public API: callWithQuorum ───────────────────────────────────────────────

/**
 * Make a JSONRPC call with quorum. The method will cross-check the result
 * with `quorum` number of nodes before returning the result.
 * @param method - The API method name (e.g., 'condenser_api.get_accounts')
 * @param params - Parameters for the API method as array or object
 * @param quorum - Default: 2 (recommended)
 */
export const callWithQuorum = async <T = any>(
  method: string,
  params: any[] | object = [],
  quorum = 2,
  signal?: AbortSignal
): Promise<T> => {
  if (!Array.isArray(config.nodes)) {
    throw new Error('config.nodes is not an Array')
  }
  if (quorum > config.nodes.length) {
    throw new Error('quorum > config.nodes.length')
  }
  // We call random nodes for better security (Fisher-Yates shuffle)
  const shuffleNodes = (arr: string[]) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  let allNodes = shuffleNodes(config.nodes)
  let currentBatchSize = Math.min(quorum, allNodes.length)
  let allResults: any[] = []
  while (currentBatchSize > 0 && allNodes.length > 0) {
    // Take next batch of nodes
    const batchNodes = allNodes.splice(0, currentBatchSize)
    const promises: Promise<any>[] = []
    const batchResults: any[] = []
    // Launch batch calls in parallel
    for (let i = 0; i < batchNodes.length; i++) {
      promises.push(
        jsonRPCCall(batchNodes[i], method, params, undefined, true, signal)
          .then((data) => batchResults.push(data))
          .catch(() => {})
      )
    }
    await Promise.all(promises)
    allResults.push(...batchResults)
    // Check for consensus in successful results
    const consensusResult = findConsensus(allResults, quorum)
    if (consensusResult) {
      return consensusResult
    }
    // Prepare next batch
    currentBatchSize = Math.min(quorum, allNodes.length)
    if (currentBatchSize === 0) {
      throw new Error('No more nodes available.')
    }
  }
  throw new Error("Couldn't reach quorum.")
}

function findConsensus(results: any[], quorum: number) {
  const resultGroups = new Map<string, any[]>()
  for (const result of results) {
    const key = JSON.stringify(result)
    if (!resultGroups.has(key)) {
      resultGroups.set(key, [])
    }
    resultGroups.get(key)!.push(result)
  }
  const consensusGroup = Array.from(resultGroups.values()).find((group) => group.length >= quorum)
  return consensusGroup ? consensusGroup[0] : null
}
