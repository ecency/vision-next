/**
 * Serves a precomputed sitemap child shard from Redis (written by the
 * sitemap-generation cron). Same contract as the index route: thin O(1)
 * read, CDN-cached, fail-open on miss, Node runtime (ioredis).
 *
 * `shard` is the child filename referenced by the index, e.g.
 * `posts-2026-05.xml`. Strictly validated to avoid Redis key injection.
 */
import { getSeoRedis, SEO_REDIS_PREFIX } from "@/features/seo/seo-redis";

export const dynamic = "force-dynamic";

const CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";
const SHARD_RE = /^[a-z0-9][a-z0-9._-]{0,80}\.xml$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shard: string }> }
): Promise<Response> {
  const { shard } = await params;
  if (!SHARD_RE.test(shard)) {
    return new Response("Not Found", { status: 404 });
  }
  const redis = getSeoRedis();
  if (!redis) return new Response("Not Found", { status: 404 });
  try {
    const xml = await redis.get(`${SEO_REDIS_PREFIX}sitemap:${shard}`);
    if (!xml) return new Response("Not Found", { status: 404 });
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": CACHE
      }
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
