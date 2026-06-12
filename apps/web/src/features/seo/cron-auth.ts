import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Shared-secret gate for the internal SEO cron routes. The `vision_seocron`
 * Swarm service sends `x-seo-cron-secret`; without a matching secret the
 * route 404s (never reveal the endpoint exists). Disabled (404 for all) when
 * the env var is unset.
 */
const SECRET = process.env.SEO_CRON_SECRET;

// SHA-256 both sides to fixed-length digests, then constant-time compare. This
// avoids the byte-by-byte short-circuit of `===` (which leaks the secret's
// length and matching prefix via response-timing) without leaking length the
// way a raw timingSafeEqual length-guard would.
const digest = (value: string): Buffer =>
  createHash("sha256").update(value, "utf8").digest();

export function cronAuthorized(req: Request): boolean {
  if (!SECRET) return false;
  const provided = req.headers.get("x-seo-cron-secret");
  if (!provided) return false;
  return timingSafeEqual(digest(provided), digest(SECRET));
}

/** Uniform "go away" — 404 so the endpoint's existence isn't disclosed. */
export function notFound(): Response {
  return new Response("Not Found", { status: 404 });
}
