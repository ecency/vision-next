/**
 * Server-only client for the managed hosting service's internal (secret-guarded) endpoints.
 *
 * These endpoints activate blogs / attach custom domains, so they are protected by the shared
 * HOSTING_INTERNAL_SECRET rather than exposed to the browser. The web API routes verify a real
 * Hive identity (HiveSigner token) first, then call these on the user's behalf. The secret is
 * read from the environment and never sent to the client.
 */

const HOSTING_API = (process.env.NEXT_PUBLIC_HOSTING_API ?? "https://api.blogs.ecency.com").replace(
  /\/$/,
  ""
);

/** The shared internal secret, or null when unset (routes must 503 in that case). */
export function hostingInternalSecret(): string | null {
  const s = process.env.HOSTING_INTERNAL_SECRET;
  return s && s.length > 0 ? s : null;
}

/**
 * POST to an internal hosting endpoint with the shared secret. Caller must pass a non-null
 * `secret` (already checked). Bounded so a stalled hosting service can't pile up Node sockets.
 */
export function callHostingInternal(
  path: string,
  secret: string,
  body: unknown
): Promise<Response> {
  return fetch(`${HOSTING_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Internal-Secret": secret
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000)
  });
}
