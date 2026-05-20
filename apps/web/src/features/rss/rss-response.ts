// Edge/CDN cache for RSS responses. Bot crawlers (ClaudeBot, GPTBot,
// etc.) fan out across many feed paths and otherwise hit Hive RPC once
// per request. 5-min fresh + 1-hour SWR lets the CDN absorb that fan-out.
export const RSS_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600"
} as const;

const EMPTY_FEED_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<rss version="2.0"><channel><title>RSS Feed</title></channel></rss>';

// Returned when upstream RPC fails. Returning 200 + an empty feed instead
// of 4xx tells crawlers "nothing here right now" so they back off rather
// than retry-loop and amplify the upstream outage.
export function emptyRssResponse(): Response {
  return new Response(EMPTY_FEED_XML, {
    status: 200,
    headers: { "Content-Type": "text/xml", ...RSS_CACHE_HEADERS }
  });
}
