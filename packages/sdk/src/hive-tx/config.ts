import type { APIMethods } from './api-types'

/**
 * Unified configuration for Hive blockchain connectivity.
 * This is the single source of truth for node endpoints, timeouts, and chain settings.
 * Mutate this object directly or use ConfigManager.setHiveNodes() for validated updates.
 */
export const config = {
  /**
   * Array of Hive API node endpoints for load balancing and failover.
   */
  nodes: [
    'https://api.hive.blog',
    'https://api.deathwing.me',
    'https://api.openhive.network',
    'https://techcoderx.com',
    'https://api.syncad.com',
    'https://rpc.mahdiyari.info',
  ],

  /**
   * Array of Hive API node endpoints that support REST APIs.
   * Note: Without the trailing /
   */
  restNodes: [
    'https://api.hive.blog',
    'https://rpc.mahdiyari.info',
    'https://api.syncad.com',
    'https://hiveapi.actifit.io',
    'https://api.c0ff33a.uk'
  ],

  /**
   * Per-API REST node override. Some APIs are served by only a subset of
   * nodes; list just those capable hosts here so callREST never burns its
   * (small) retry budget on nodes that 404/503 the API, and a cold start
   * hits a capable node immediately. Any API not listed falls back to
   * `restNodes`. The health tracker still orders *within* this list.
   *
   * hivesense: empirically only ~2 public nodes serve /hivesense-api (the
   * other configured nodes 404/503 it; Ecency's own was decommissioned), so
   * pin them — otherwise the health tracker keeps rediscovering incapable
   * nodes each cooldown and cold starts waste attempts.
   */
  restNodesByApi: {
    hivesense: ['https://api.hive.blog', 'https://api.syncad.com']
  } as Partial<Record<APIMethods, string[]>>,

  /**
   * User-Agent sent on server-side (Node) HTTP requests to Hive nodes.
   *
   * Node's built-in fetch (undici) sends a bare `User-Agent: node` when none is
   * set, which is indistinguishable from any random Node script in node/CDN
   * analytics. A descriptive value lets operators tell their own SSR/server
   * traffic apart from anonymous scrapers. Only applied in Node — browsers
   * forbid overriding User-Agent (it is silently dropped) and React Native sets
   * its own native UA, so client and mobile traffic are untouched. Override via
   * `ConfigManager.setUserAgent()` (or `setUserAgent()` from `@ecency/sdk/hive`).
   */
  userAgent: 'ecency-sdk',

  /**
   * The Hive blockchain chain ID for transaction signing and verification.
   */
  chain_id: 'beeab0de00000000000000000000000000000000000000000000000000000000',

  /**
   * Address prefix used for public key formatting (STM for mainnet).
   */
  address_prefix: 'STM',

  /**
   * Timeout in milliseconds for read API calls (get_content, get_accounts, etc.).
   * Kept short so the health tracker can fail over to another node quickly.
   */
  timeout: 5_000,

  /**
   * Timeout in milliseconds for broadcast API calls.
   * Longer than read timeout because broadcast_transaction_synchronous waits
   * for block inclusion, which depends on the 3-second block interval and
   * network conditions.
   */
  broadcastTimeout: 15_000,

  /**
   * Number of retry attempts for failed API calls before throwing an error.
   * Total attempts = retry + 1. With ~7 nodes in the list, a budget of 5
   * means callRPC iterates through 6 distinct nodes before giving up, so a
   * single sick node (or two) can't surface as an unhandled error to the
   * caller while the rest of the list is healthy.
   */
  retry: 5
}

/**
 * Validated setter for the Hive RPC node list — replaces `config.nodes`.
 * Trims, drops non-http(s) entries, and de-dupes (order-preserving). A no-op
 * if nothing valid remains, so a bad input can't empty the list.
 *
 * Lives here, in the React-free `hive-tx` core, on purpose: it must be
 * reachable from BOTH the full `@ecency/sdk` entry (via
 * `ConfigManager.setHiveNodes`, which delegates here) and the lean
 * `@ecency/sdk/hive` server/CLI entry — without dragging react-query or the
 * DMCA/ReDoS surface of `ConfigManager` into the lean entry. Within a single
 * bundle this mutates the one `config` instance `callRPC` reads; the
 * cross-bundle single-instance guarantee is a separate (build-level) concern.
 */
/**
 * Trim, drop non-string / non-http(s), and de-dupe (order-preserving) a node
 * list. Shared by `setNodes` and the REST-node setters below so all three
 * normalize identically.
 */
const sanitizeNodeList = (nodes: unknown): string[] =>
  Array.isArray(nodes)
    ? [
        ...new Set(
          nodes
            .filter((n): n is string => typeof n === 'string')
            // Trim, then strip trailing slashes so REST paths concatenate cleanly:
            // `callREST` builds `node + '/status-api'`, and a `https://host/` node would
            // otherwise yield `https://host//status-api`, which several HAF nodes 404.
            // De-dupe AFTER normalizing so `host` and `host/` collapse to one entry.
            .map((n) => n.trim().replace(/\/+$/, ''))
            .filter((n) => n.length > 0 && /^https?:\/\/.+/.test(n))
        )
      ]
    : []

export const setNodes = (nodes: string[]): void => {
  const validNodes = sanitizeNodeList(nodes)
  if (!validNodes.length) return
  config.nodes = validNodes
}

/**
 * Validated setter for the REST-API node list — replaces `config.restNodes`.
 * Same shape/guarantees as `setNodes` (trim, drop non-http(s), de-dupe, no-op on
 * empty). Exists because `restNodes` is otherwise baked into the SDK: an app that
 * wants to add/remove a REST host (e.g. drop an own node it is decommissioning, or
 * widen the public pool) previously had to fork + republish the SDK. With this, the
 * REST pool is app-configurable at runtime exactly like the read pool. Lives in the
 * React-free `hive-tx` core so both the full `@ecency/sdk` entry and the lean
 * `@ecency/sdk/hive` entry can reach it.
 */
export const setRestNodes = (nodes: string[]): void => {
  const valid = sanitizeNodeList(nodes)
  if (!valid.length) return
  config.restNodes = valid
}

/**
 * Merge validated per-API REST node overrides into `config.restNodesByApi`.
 * For each entry: a non-empty, valid list pins that API to those hosts; an empty or
 * all-invalid list REMOVES the pin so the API falls back to `restNodes`. Other APIs'
 * existing pins (e.g. the built-in `hivesense`) are preserved. Lets an app pin the
 * APIs it actually uses to known-capable hosts (so `callREST` never burns its small
 * retry budget on a node that 404/503s the API) without an SDK republish.
 */
export const setRestNodesByApi = (
  map: Partial<Record<APIMethods, string[]>>
): void => {
  if (!map || typeof map !== 'object') return
  const next: Partial<Record<APIMethods, string[]>> = { ...config.restNodesByApi }
  for (const [api, list] of Object.entries(map)) {
    const valid = sanitizeNodeList(list)
    if (valid.length) {
      next[api as APIMethods] = valid
    } else {
      delete next[api as APIMethods]
    }
  }
  config.restNodesByApi = next
}

/**
 * Validated setter for the User-Agent sent on server-side (Node) requests.
 * Trims the input and ignores an empty value so a bad input can't blank out the
 * header. Like `setNodes`, it lives in the React-free `hive-tx` core so it is
 * reachable from both the full `@ecency/sdk` entry (via
 * `ConfigManager.setUserAgent`) and the lean `@ecency/sdk/hive` server/CLI entry.
 */
export const setUserAgent = (ua: string): void => {
  // Defensive against plain-JS / React Native callers that may pass a non-string
  // despite the `string` type (avoids throwing on `.trim()`).
  if (typeof ua !== 'string') return
  const value = ua.trim()
  // Ignore blank values, and reject control characters (CR, LF, and other
  // C0/DEL controls). An invalid header value would otherwise be stored and make
  // every subsequent fetch throw, and rejecting CR/LF closes a header-injection
  // vector for any caller that builds the UA from untrusted input.
  if (!value || /[\u0000-\u001f\u007f]/.test(value)) return
  config.userAgent = value
}
