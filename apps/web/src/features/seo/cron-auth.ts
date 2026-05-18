/**
 * Shared-secret gate for the internal SEO cron routes. The `vision_seocron`
 * Swarm service sends `x-seo-cron-secret`; without a matching secret the
 * route 404s (never reveal the endpoint exists). Disabled (404 for all) when
 * the env var is unset.
 */
const SECRET = process.env.SEO_CRON_SECRET;

export function cronAuthorized(req: Request): boolean {
  if (!SECRET) return false;
  const provided = req.headers.get("x-seo-cron-secret");
  return !!provided && provided === SECRET;
}

/** Uniform "go away" — 404 so the endpoint's existence isn't disclosed. */
export function notFound(): Response {
  return new Response("Not Found", { status: 404 });
}
