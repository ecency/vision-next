/**
 * REST API method identifiers for Hive blockchain APIs.
 * Used by callREST() to route requests to the correct API path prefix.
 */
export type APIMethods =
  | 'balance'
  | 'hafah'
  | 'hafbe'
  | 'hivemind'
  | 'hivesense'
  | 'reputation'
  | 'nft-tracker'
  | 'hafsql'
  | 'status'
