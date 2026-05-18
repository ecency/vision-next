/**
 * The canonical, closed set of sitemap child-shard names — the single source
 * of truth shared by the generator (writer, /api/internal/seo/sitemap-generate)
 * and the public shard route (reader/validator, /sitemap/[shard]).
 *
 * Using an exact allowlist instead of a permissive regex removes a whole class
 * of silent failures: a generator/route case or formatting mismatch can't make
 * a shard 404 invisibly, and there's no Redis-key-injection surface. Adding a
 * shard means adding it here (and emitting it from the generator) — both sides
 * stay in lockstep by construction.
 */
export const SITEMAP_SHARDS = [
  "posts.xml",
  "authors.xml",
  "communities.xml",
  "static.xml"
] as const;

export type SitemapShard = (typeof SITEMAP_SHARDS)[number];

const SHARD_SET: ReadonlySet<string> = new Set(SITEMAP_SHARDS);

export function isKnownShard(name: string): name is SitemapShard {
  return SHARD_SET.has(name);
}
