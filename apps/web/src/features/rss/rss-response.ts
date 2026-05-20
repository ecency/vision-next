import * as Sentry from "@sentry/nextjs";
import { isTransientUpstreamError } from "./rss-handler";

// Edge/CDN cache for RSS responses. Bot crawlers (ClaudeBot, GPTBot,
// etc.) fan out across many feed paths and otherwise hit Hive RPC once
// per request. 5-min fresh + 1-hour SWR lets the CDN absorb that fan-out.
export const RSS_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600"
} as const;

// Shorter TTL for empty/error feeds so a transient upstream outage
// doesn't pin every CDN edge to an empty feed for the full success TTL.
const RSS_ERROR_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60"
} as const;

// RSS 2.0 requires <title>, <link>, and <description> on every <channel>.
// Aggregators reject malformed feeds and may retry-loop, defeating the
// backoff this fallback is meant to provide.
const EMPTY_FEED_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<rss version="2.0"><channel>' +
  "<title>Ecency RSS Feed</title>" +
  "<link>https://ecency.com</link>" +
  "<description>Feed temporarily unavailable</description>" +
  "</channel></rss>";

// Returned when upstream RPC fails. Returning 200 + an empty feed instead
// of 4xx tells crawlers "nothing here right now" so they back off rather
// than retry-loop and amplify the upstream outage.
export function emptyRssResponse(): Response {
  return new Response(EMPTY_FEED_XML, {
    status: 200,
    headers: { "Content-Type": "text/xml", ...RSS_ERROR_CACHE_HEADERS }
  });
}

// Report only the errors that aren't part of the known transient-upstream
// noise pattern, then return the empty-feed fallback. Lets the route
// remain a one-liner in the catch while still surfacing real regressions.
export function emptyRssResponseWithReport(
  e: unknown,
  context: { route: string; pathname: string }
): Response {
  if (!isTransientUpstreamError(e)) {
    Sentry.captureException(e, { extra: context });
  }
  return emptyRssResponse();
}
