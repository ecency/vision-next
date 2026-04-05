import { NextRequest, NextResponse } from "next/server";
import {
  buildCacheControlHeader,
  getCachePolicyForPath,
  handleIndexRedirect,
  isIndexRedirect
} from "@/features/next-middleware";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts/cookies";

const CACHE_HEADERS_ENABLED = process.env.ENABLE_HTML_CACHE_HEADERS === "true";

const METHOD_NOT_ALLOWED_HEADERS = { Allow: "GET, HEAD, OPTIONS" };

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Reject write methods on page routes up-front. Without this, an unhandled
  // POST/PUT/DELETE/PATCH to a page URL (most commonly POST / from bots or
  // from the landing-page subscribe form falling back to native submit when
  // JS fails) still engages the Next.js request pipeline — reading the body,
  // stepping through rewrites, invoking render code — and can pin the event
  // loop for minutes under slow-loris style bodies. Returning 405 from the
  // Edge middleware short-circuits before any body is read.
  //
  // Carve-outs:
  //   - /api/*       — route handlers that explicitly accept write methods
  //   - /pl/*        — Plausible analytics proxy (see next.config.js rewrites)
  //   - next-action  — reserved for future Next.js Server Actions
  const isWriteMethod =
    method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH";
  if (isWriteMethod) {
    const isApiRoute = pathname.startsWith("/api/");
    const isPlausibleProxy = pathname.startsWith("/pl/");
    const isServerAction = request.headers.has("next-action");
    if (!isApiRoute && !isPlausibleProxy && !isServerAction) {
      return new NextResponse(null, {
        status: 405,
        headers: METHOD_NOT_ALLOWED_HEADERS
      });
    }
  }

  if (method !== "GET") return;

  if (isIndexRedirect(request)) {
    return handleIndexRedirect(request);
  }

  // Decode URL and redirect if needed
  const path = request.nextUrl.pathname;
  try {
    const decodedPath = decodeURIComponent(path);
    if (decodedPath !== path) {
      const url = request.nextUrl.clone();
      url.pathname = decodedPath;
      return NextResponse.redirect(url);
    }
  } catch (e) {
    if (e instanceof URIError) {
      console.warn("Failed to decode request path", path, e);
    } else {
      throw e;
    }
  }

  // block invalid permlinks with file extensions
  if (path.match(/^\/[^\/]+\/@[\w\d.-]+\/[a-z0-9-]+\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    console.warn("Blocked invalid permlink with file extension:", path);
    return new NextResponse("Not found", { status: 404 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  const isSocialBot =
    /Discordbot|Twitterbot|facebookexternalhit|TelegramBot|LinkedInBot|Slackbot|WhatsApp|redditbot/i.test(
      userAgent
    );

  if (isSocialBot && path.match(/^\/[^\/]+\/@[^\/]+\/[^\/]+$/)) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname += "/redditbot";
    return NextResponse.rewrite(nextUrl);
  }

  const response = NextResponse.next();
  applyCacheHeaders(request, response, path);
  return response;
}

function applyCacheHeaders(request: NextRequest, response: NextResponse, path: string) {
  if (!CACHE_HEADERS_ENABLED) return;

  const policy = getCachePolicyForPath(path);
  if (!policy) return;

  const isLoggedIn = request.cookies.has(ACTIVE_USER_COOKIE_NAME);
  response.headers.set("Cache-Control", buildCacheControlHeader(policy, isLoggedIn));
  response.headers.set("x-cache-tier", isLoggedIn ? "logged-in" : policy.tier);
  // NOTE: we deliberately do NOT emit `Vary: Cookie`. That would fragment the
  // edge cache on every cookie (analytics, locale, experiments) and cripple
  // hit ratio. Auth bifurcation happens at the infra layer:
  //   - Nginx: cache key includes $cookie_active_user
  //   - CF worker: explicitly bypasses cache when active_user cookie present
  // See docs/cache/nginx.md and docs/cache/cloudflare-worker.md.
}
