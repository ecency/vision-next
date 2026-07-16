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

const TENANT_NAME_RE = /^[a-z][a-z0-9.-]{2,15}$/;

export type OwnedTenantResult =
  | { ok: true; username: string }
  | { ok: false; status: number; error: string };

/**
 * Resolve which tenant a domain call targets and enforce ownership. With no `requested`
 * tenant (or the owner's own name) the target is the owner's personal blog, exactly as
 * before. A different tenant (a community instance, keyed by its community id) is allowed
 * only when the hosting service confirms the authenticated user is its controlling owner.
 */
export async function resolveOwnedTenant(
  requested: unknown,
  owner: string
): Promise<OwnedTenantResult> {
  const tenant = typeof requested === "string" ? requested.trim().toLowerCase() : "";
  if (!tenant || tenant === owner) {
    return { ok: true, username: owner };
  }
  if (!TENANT_NAME_RE.test(tenant)) {
    return { ok: false, status: 400, error: "Invalid tenant" };
  }

  let res: Response;
  try {
    res = await fetch(`${HOSTING_API}/v1/tenants/${encodeURIComponent(tenant)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000)
    });
  } catch {
    return { ok: false, status: 502, error: "Hosting service unavailable" };
  }

  if (res.status === 404) {
    return { ok: false, status: 404, error: "Tenant not found" };
  }
  if (!res.ok) {
    return { ok: false, status: 502, error: "Hosting service unavailable" };
  }

  const data = (await res.json().catch(() => null)) as { owner?: string } | null;
  if (!data || data.owner !== owner) {
    return { ok: false, status: 403, error: "Not the tenant owner" };
  }
  return { ok: true, username: tenant };
}
