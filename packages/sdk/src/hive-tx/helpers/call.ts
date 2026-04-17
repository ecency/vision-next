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

/**
 * Check if an error is a pre-connection error (request never reached server).
 *
 * Node.js fetch wraps connection failures as TypeError('fetch failed') with
 * the real error code nested in the cause chain: e.cause.code, e.cause.cause.code, etc.
 * We walk up to 5 levels deep to find the actual code.
 */
function isPreConnectionError(e: any): boolean {
  if (!e) return false
  const parts: string[] = [String(e.message || ''), String(e.code || '')]
  let cause = e.cause
  for (let depth = 0; cause && depth < 5; depth++) {
    parts.push(String(cause.code || ''), String(cause.message || ''))
    cause = cause.cause
  }
  const combined = parts.join(' ')
  return PRE_CONNECTION_ERRORS.some((code) => combined.includes(code))
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
        headBlockUpdatedAt: 0
      }
      this.health.set(node, h)
    }
    return h
  }

  recordSuccess(node: string, api?: string): void {
    const h = this.getOrCreate(node)
    h.consecutiveFailures = 0
    if (api) {
      // A successful API call clears that API's failure counter.
      h.apiFailures.delete(api)
    }
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

  /** Return nodes sorted: healthy first (preserving order), unhealthy appended. */
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
    return [...healthy, ...unhealthy]
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
  } else {
    tracker.recordFailure(node, api)
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
 * Throws RPCError for blockchain rejections, NodeError for HTTP 429/503,
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
    if (res.status === 503) {
      throw new NodeError(url, `HTTP 503 Service Unavailable`)
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
    try {
      const res = await jsonRPCCall(node, method, params, timeout, false, signal)
      rpcHealthTracker.recordSuccess(node, api)
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
  timeout = config.timeout,
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

      // Only retry broadcasts on pre-connection errors where the request
      // definitely never reached the server. On timeouts or HTTP errors,
      // the server may have received and processed the transaction.
      if (!isPreConnectionError(e)) {
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
  const triedInRound = new Set<string>()
  let lastError: any
  // Track whether the error was already recorded by the HTTP status handler
  let alreadyRecorded = false

  for (let attempt = 0; attempt <= retry; attempt++) {
    // Re-evaluate node order each attempt so health changes are respected.
    // Pass api so per-API cooldowns are respected.
    const orderedNodes = restHealthTracker.getOrderedNodes(config.restNodes, api)
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
      restHealthTracker.recordSuccess(node, api)
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
  quorum = 2
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
        jsonRPCCall(batchNodes[i], method, params, undefined, true)
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
