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
    'https://techcoderx.com',
    'https://hiveapi.actifit.io',
    'https://api.c0ff33a.uk'
  ],

  /**
   * The Hive blockchain chain ID for transaction signing and verification.
   */
  chain_id: 'beeab0de00000000000000000000000000000000000000000000000000000000',

  /**
   * Address prefix used for public key formatting (STM for mainnet).
   */
  address_prefix: 'STM',

  /**
   * Timeout in milliseconds for individual API calls.
   */
  timeout: 5_000,

  /**
   * Number of retry attempts for failed API calls before throwing an error.
   */
  retry: 1
}
