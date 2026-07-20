// Helpers for the /api/speak-audio route, kept out of route.ts because Next
// only permits a route module to export request handlers and its known config
// exports. They were exported from route.ts purely so the unit tests could
// reach them, which made `next build` emit a route-validator type error.
//
// Moved verbatim from route.ts; no behaviour changes.

import { isIP } from "node:net";

const ALLOWED_HOST = "cdn.liketu.com";
// Extensions Liketu serves Speak audio under (mirrors render-helper's
// LIKETU_AUDIO_REGEX). The host allowlist is the real guard; this just rejects
// obviously-wrong inputs early.
export const ALLOWED_EXT = /\.(?:webm|mp3|m4a|ogg|wav)$/i;

// Immutable: the CDN path is content-addressed, so a successful transcode never
// changes. Long max-age + s-maxage lets both the browser and the CF edge pin it.
const AUDIO_CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, immutable";

export class CodedError extends Error {
  constructor(
    public code: string,
    public status: number
  ) {
    super(code);
  }
}
// Hive account names: 3-16 chars, lowercase letters/digits/dot/hyphen. Exported
// for tests. Keeps the looked-up reference well-formed before it reaches getPost.
export const isValidAuthor = (a: string | null): a is string => !!a && /^[a-z0-9.-]{3,16}$/.test(a);

// Permlinks: lowercase letters/digits/hyphens (bounded length). Exported for tests.
export const isValidPermlink = (p: string | null): p is string =>
  !!p && /^[a-z0-9-]{1,256}$/.test(p);

/**
 * Validate an on-chain speak audio URL: https + exact cdn.liketu.com host +
 * default port + audio extension + /liketu/ media path. Throws a CodedError on
 * any failure. Exported for unit tests. Returns the parsed URL.
 */
export function parseSpeakSource(src: unknown): URL {
  if (!src || typeof src !== "string") {
    throw new CodedError("MISSING_SRC", 400);
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    throw new CodedError("INVALID_SRC", 400);
  }

  if (url.protocol !== "https:") {
    throw new CodedError("INVALID_SRC", 400);
  }

  // Exact host match (not endsWith) so e.g. "cdn.liketu.com.evil.tld" is rejected.
  if (url.hostname.toLowerCase() !== ALLOWED_HOST) {
    throw new CodedError("HOST_NOT_ALLOWED", 400);
  }

  // Reject any explicit non-default port — keeps this from being aimed at other
  // TCP services even on the allowlisted host.
  if (url.port !== "" && url.port !== "443") {
    throw new CodedError("HOST_NOT_ALLOWED", 400);
  }

  if (!ALLOWED_EXT.test(url.pathname)) {
    throw new CodedError("UNSUPPORTED_EXT", 400);
  }

  // Constrain to Liketu's media path root. Even on the allowlisted host this keeps
  // the endpoint from being used to fetch arbitrary CDN files, and it rejects a
  // host-mimicking "//evil.com/..." pathname outright.
  if (!url.pathname.startsWith("/liketu/")) {
    throw new CodedError("UNSUPPORTED_PATH", 400);
  }

  return url;
}

/**
 * Expand an IPv6 address to its full 8-group, zero-padded form for prefix
 * matching. e.g. "2001:db8::1" -> "2001:0db8:0000:...:0001".
 */
function expandIPv6(ip: string): string {
  const halves = ip.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length > 1 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  const mid = Array(missing > 0 ? missing : 0).fill("0000");
  return [...left, ...mid, ...right].map((g) => g.padStart(4, "0")).join(":");
}

/**
 * True for non-globally-routable IPs (defense-in-depth against DNS rebinding).
 * Mirrors apps/web/src/app/api/import/route.ts — handles IPv4-mapped IPv6 in
 * both dotted and hex form, plus the reserved/special-use ranges. Exported for tests.
 */
export function isPrivateIP(ip: string): boolean {
  let normalized = ip;
  const v4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4Mapped) {
    normalized = v4Mapped[1];
  }
  // IPv4-mapped IPv6 in hex form, e.g. ::ffff:0a00:0001 == 10.0.0.1
  const v4MappedHex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (v4MappedHex) {
    const high = parseInt(v4MappedHex[1], 16);
    const low = parseInt(v4MappedHex[2], 16);
    normalized = `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`;
  }

  if (isIP(normalized) === 4) {
    const [a, b, c] = normalized.split(".").map(Number);
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // RFC1918
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24 IETF protocol
    if (a === 192 && b === 0 && c === 2) return true; // 192.0.2.0/24 TEST-NET-1
    if (a === 192 && b === 88 && c === 99) return true; // 192.88.99.0/24 6to4 relay
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 198 && b >= 18 && b <= 19) return true; // 198.18.0.0/15 benchmarking
    if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 TEST-NET-2
    if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 TEST-NET-3
    if (a >= 224) return true; // multicast + reserved
    return false;
  }

  if (isIP(normalized) === 6) {
    const full = expandIPv6(normalized);
    if (full === "0000:0000:0000:0000:0000:0000:0000:0000") return true; // ::
    if (full === "0000:0000:0000:0000:0000:0000:0000:0001") return true; // ::1
    const g1 = parseInt(full.slice(0, 4), 16);
    if (g1 >= 0xfc00 && g1 <= 0xfdff) return true; // fc00::/7 ULA
    if ((g1 & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if (full.startsWith("2001:0db8")) return true; // 2001:db8::/32 documentation
    if (full.startsWith("2001:0000")) return true; // 2001::/32 Teredo
    if (full.startsWith("0100:0000:0000:0000")) return true; // 100::/64 discard
    if (g1 >= 0xff00) return true; // ff00::/8 multicast
    return false;
  }

  return true; // unparseable -> treat as unsafe
}

const audioHeaders = (extra: Record<string, string>): Record<string, string> => ({
  "Content-Type": "audio/mp4",
  "Accept-Ranges": "bytes",
  "Cache-Control": AUDIO_CACHE_CONTROL,
  "X-Content-Type-Options": "nosniff",
  ...extra
});

/**
 * Parse a single HTTP Range header against a known content size. Returns the
 * inclusive byte range, "unsatisfiable" for an out-of-bounds range, or null when
 * there is no honourable single range. Exported for tests.
 */
export function parseRange(
  rangeHeader: string | null,
  size: number
): { start: number; end: number } | "unsatisfiable" | null {
  if (!rangeHeader) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!m) return null;
  const hasStart = m[1] !== "";
  const hasEnd = m[2] !== "";
  if (!hasStart && !hasEnd) return null;

  let start: number;
  let end: number;
  if (!hasStart) {
    // suffix range: final N bytes
    const n = parseInt(m[2], 10);
    if (!Number.isFinite(n) || n <= 0) return "unsatisfiable";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = parseInt(m[1], 10);
    end = hasEnd ? parseInt(m[2], 10) : size - 1;
  }
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    return "unsatisfiable";
  }
  return { start, end: Math.min(end, size - 1) };
}

/** Build the audio response, honouring a Range request (206/416) when present. Exported for tests. */
export function buildAudioResponse(output: Buffer, rangeHeader: string | null): Response {
  const size = output.byteLength;
  const range = parseRange(rangeHeader, size);
  if (range === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}`, "Cache-Control": "no-store" }
    });
  }
  if (range) {
    const chunk = output.subarray(range.start, range.end + 1);
    return new Response(new Uint8Array(chunk), {
      status: 206,
      headers: {
        "Content-Type": "audio/mp4",
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        "Content-Length": String(chunk.byteLength),
        // A partial must NEVER be cached as the canonical object: only the full
        // 200 carries the immutable cache, so a 206 can't poison the cache for a
        // later no-Range request. (Cloudflare fetches the full object on a range
        // miss and serves ranges from it, so this doesn't hurt the hit rate.)
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  }
  // Node Buffer isn't a DOM BodyInit; hand the Response a plain Uint8Array view.
  return new Response(new Uint8Array(output), {
    status: 200,
    headers: audioHeaders({ "Content-Length": String(size) })
  });
}
