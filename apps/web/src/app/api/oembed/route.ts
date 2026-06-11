import { getServerAppBase } from "@/utils/server-app-base";
import { loadEntry, AGENT_CACHE_CONTROL } from "@/app/(dynamicPages)/entry/_helpers/agent-readable";
import { buildEntryCardFields } from "@/app/(dynamicPages)/entry/_helpers/entry-card-fields";
import { parseEntryUrl } from "./parse-entry-url";

// Reads request.url search params → inherently dynamic; CDN caches via headers.
export const dynamic = "force-dynamic";

// Public, inert JSON. Mirrors the agent endpoints' cache + noindex posture and
// adds CORS so browser-side oEmbed consumers can read it. No CSP sandbox here:
// this is a data API fetched cross-origin, not a document meant to render.
const OEMBED_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": AGENT_CACHE_CONTROL,
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex"
};

function errorResponse(status: number): Response {
  return new Response(null, {
    status,
    headers: { "Access-Control-Allow-Origin": "*", "X-Robots-Tag": "noindex" }
  });
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const target = searchParams.get("url");
  if (!target) return errorResponse(400);

  // We only implement JSON. The spec suggests 501 for an unsupported format,
  // but our Cloudflare failover treats any origin 5xx as "origin unavailable"
  // and rewrites it to a 502 — so return 400 (the consumer asked for a format
  // we don't offer, i.e. a client error) to stay correct through the edge.
  const format = searchParams.get("format");
  if (format && format !== "json") return errorResponse(400);

  const parsed = parseEntryUrl(target);
  if (!parsed) return errorResponse(404);

  try {
    // Option A (lossless): serve card data for ANY resolvable post so our own
    // in-post link cards keep rendering for every link, including suppressed
    // ones. External auto-unfurl is constrained separately — the discovery
    // <link> on entry pages is emitted for indexable posts only. To gate this
    // endpoint too, swap loadEntry → loadIndexableEntry.
    const loaded = await loadEntry(parsed.author, parsed.permlink);
    if (!loaded) return errorResponse(404);

    const base = await getServerAppBase();
    const { title, summary, image } = buildEntryCardFields(loaded.entry);

    const payload: Record<string, unknown> = {
      version: "1.0",
      type: "link",
      title,
      author_name: loaded.entry.author,
      author_url: `${base}/@${loaded.entry.author}`,
      provider_name: "Ecency",
      provider_url: base,
      cache_age: 300,
      // Non-standard extension: standard consumers ignore unknown fields;
      // Ecency's own in-post link enhancer reads it for the card description.
      description: summary
    };

    if (image) {
      payload.thumbnail_url = image;
      payload.thumbnail_width = 1200;
      payload.thumbnail_height = 630;
    }

    return new Response(JSON.stringify(payload), { status: 200, headers: OEMBED_HEADERS });
  } catch (e) {
    // The post parsed and may well exist — a failure building the response is a
    // server error, not a missing resource. Surface it (5xx) and log, the way
    // generateEntryMetadata does, instead of masking it as a 404.
    console.error("oembed: failed to build response for", parsed, e);
    return errorResponse(500);
  }
}
