import type { LookupFunction } from "node:net";

/**
 * Build a DNS lookup function that always returns the IP address that was
 * resolved and validated before the request started.
 *
 * Node asks custom lookup functions for either one address or all addresses,
 * depending on its automatic address-family selection settings. Returning the
 * scalar form for an `all` request makes Node read `.address` from a string and
 * fail with ERR_INVALID_IP_ADDRESS.
 */
export function createPinnedLookup(ip: string, family: 4 | 6): LookupFunction {
  return (_hostname, options, callback) => {
    if (options?.all) {
      callback(null, [{ address: ip, family }]);
      return;
    }

    callback(null, ip, family);
  };
}
