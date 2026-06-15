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
    'https://hapi.ecency.com',
    'https://api.hive.blog',
    'https://rpc.mahdiyari.info',
    'https://techcoderx.com',
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
export const setNodes = (nodes: string[]): void => {
  const validNodes = [
    ...new Set(
      nodes
        .map((n) => n.trim())
        .filter((n) => n.length > 0 && /^https?:\/\/.+/.test(n))
    )
  ]
  if (!validNodes.length) return
  config.nodes = validNodes
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
