import { NextRequest, NextResponse } from "next/server";

/**
 * Canonicalize percent-encoded request paths to their decoded form with a 307
 * (e.g. `/%40user` -> `/@user`) so the URL is honest for routing, analytics and
 * cache policy.
 *
 * Returns:
 *   - a 307 redirect when the decoded path differs and is a safe same-origin path
 *   - a 400 response when the decoded path would redirect off-origin
 *   - `null` when no redirect is needed (path already canonical, or undecodable)
 *
 * Open-redirect guard (CWE-601): a decoded path such as `/\evil.com/..` is
 * normalized by the WHATWG pathname setter to one beginning with `//`, which
 * `NextResponse.redirect` serializes as a protocol-relative `Location`
 * (`//evil.com`) that the browser resolves OFF-origin. We therefore refuse any
 * protocol-relative / cross-origin redirect target. Note: assigning `.pathname`
 * never mutates `.origin`, so the leading-`//` check — not the origin check — is
 * what actually stops this payload; the origin check is defense in depth.
 */
export function handleDecodedPathRedirect(request: NextRequest): NextResponse | null {
  const path = request.nextUrl.pathname;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
  } catch (e) {
    if (e instanceof URIError) {
      console.warn("Failed to decode request path", path, e);
      return null;
    }
    throw e;
  }

  if (decodedPath === path) return null;

  const url = request.nextUrl.clone();
  url.pathname = decodedPath;

  if (url.pathname.startsWith("//") || url.origin !== request.nextUrl.origin) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // Guard against redirect loops: when the path contains characters the URL
  // pathname setter does NOT re-encode (e.g. brackets in `[object Object]`),
  // the re-encoded canonical form equals the path we received, so redirecting
  // would 307 to the same URL forever — see the ERR_TOO_MANY_REDIRECTS reports
  // on `/@user/[object Object]` paths produced when a non-string value gets
  // templated into a URL elsewhere in the app.
  if (url.pathname === path) return null;

  return NextResponse.redirect(url);
}
