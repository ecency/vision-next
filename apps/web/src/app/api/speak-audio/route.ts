import { NextRequest } from "next/server";
import { Resolver } from "node:dns/promises";
import { isIP, type LookupFunction } from "node:net";
import { Agent } from "undici";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Node runtime: needs child_process (ffmpeg), node:dns and undici dispatcher
// pinning. Force-dynamic so Next never tries to statically cache the handler —
// edge caching is governed entirely by the response Cache-Control below.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// -----------------------------------------------------------------------------
// /api/speak-audio?src=<cdn.liketu.com ...webm>
//
// Liketu "Speak" voice posts store their audio as Opus-in-WebM on cdn.liketu.com.
// Browsers (and Android/ExoPlayer) play that natively, but iOS AVPlayer — what
// react-native-video and Safari use — cannot demux WebM or decode Opus. This
// endpoint transcodes the clip to AAC/m4a so every client can play it.
//
// The source audio is immutable (content-addressed CDN path), so the response is
// marked immutable + long-TTL: Cloudflare edge-caches each clip and the origin
// only transcodes on a cache miss (a handful per day at Speak's volume).
// -----------------------------------------------------------------------------

const ALLOWED_HOST = "cdn.liketu.com";
// Extensions Liketu serves Speak audio under (mirrors render-helper's
// LIKETU_AUDIO_REGEX). The host allowlist is the real guard; this just rejects
// obviously-wrong inputs early.
const ALLOWED_EXT = /\.(?:webm|mp3|m4a|ogg|wav)$/i;

const FETCH_TIMEOUT_MS = 15_000;
const FFMPEG_TIMEOUT_MS = 30_000;
const MAX_INPUT_BYTES = 25 * 1024 * 1024; // 25MB — voice clips are well under 1MB
const MAX_OUTPUT_BYTES = 30 * 1024 * 1024;

// Immutable: the CDN path is content-addressed, so a successful transcode never
// changes. Long max-age + s-maxage lets both the browser and the CF edge pin it.
const AUDIO_CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, immutable";

// Bound concurrent ffmpeg processes so a burst of cache-miss requests can't
// saturate the box CPU. Excess requests get a short 503 + Retry-After; CF and
// the client retry, and by then the cache is usually warm.
const MAX_CONCURRENT_TRANSCODES = 4;
let activeTranscodes = 0;

class CodedError extends Error {
  constructor(
    public code: string,
    public status: number
  ) {
    super(code);
  }
}

/**
 * Synchronous URL validation: https + exact host allowlist + audio extension +
 * default port only. Exported for unit tests. Returns the parsed URL.
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

/**
 * Resolve the (already host-allowlisted) hostname, reject if any record is
 * private/reserved, and return an undici dispatcher pinned to the validated IP.
 * Pinning closes the DNS-rebinding TOCTOU window between resolution and connect;
 * the original hostname rides on the request so TLS SNI/cert checks still verify
 * against cdn.liketu.com. Mirrors apps/web/src/app/api/import/route.ts.
 */
async function resolveAndPin(hostname: string): Promise<Agent> {
  const resolver = new Resolver();
  const [v4, v6] = await Promise.all([
    resolver.resolve4(hostname).catch(() => [] as string[]),
    resolver.resolve6(hostname).catch(() => [] as string[])
  ]);
  const all = [...v4, ...v6];
  if (all.length === 0) {
    throw new CodedError("FETCH_FAILED", 502);
  }
  for (const ip of all) {
    if (isPrivateIP(ip)) {
      throw new CodedError("HOST_NOT_ALLOWED", 400);
    }
  }
  const pinned = v4[0] ?? v6[0];
  const family: 4 | 6 = v4.length > 0 ? 4 : 6;
  // undici 6.x calls the connector's lookup with `{ all: true }` on some paths
  // (expecting an array of { address, family }) and the classic
  // (err, address, family) callback on others. Honour the pinned IP for both
  // shapes — returning the wrong one trips undici's ERR_INVALID_IP_ADDRESS.
  const lookup: LookupFunction = (_hostname, options, cb) => {
    if ((options as { all?: boolean })?.all) {
      (cb as (e: null, a: { address: string; family: number }[]) => void)(null, [
        { address: pinned, family }
      ]);
    } else {
      cb(null, pinned, family);
    }
  };
  return new Agent({ connect: { lookup } });
}

/** Download the source audio with the pinned dispatcher, timeout and size cap. */
async function fetchAudio(url: URL): Promise<Buffer> {
  // parseSpeakSource already pinned the host, but rebuild the request URL against
  // a CONSTANT base so the authority can only ever be cdn.liketu.com regardless of
  // any URL-parsing quirk (userinfo, etc.). Only the validated path + query carry
  // over — the user value never controls the request host.
  const safeUrl = new URL(`${url.pathname}${url.search}`, `https://${ALLOWED_HOST}`);
  const dispatcher = await resolveAndPin(safeUrl.hostname);
  try {
    const res = await fetch(safeUrl, {
      redirect: "error", // a content-addressed CDN file should never redirect
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      ...({ dispatcher } as { dispatcher: Agent })
    } as RequestInit);

    if (!res.ok || !res.body) {
      throw new CodedError("FETCH_FAILED", 502);
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_INPUT_BYTES) {
        await reader.cancel();
        throw new CodedError("INPUT_TOO_LARGE", 413);
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    void dispatcher.close().catch(() => {});
  }
}

/** Transcode webm/opus (or any input) -> AAC/m4a with a progressive (faststart) moov. */
async function transcodeToAac(input: Buffer, ext: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "speak-"));
  const inPath = join(dir, `input${ext}`);
  const outPath = join(dir, "output.m4a");
  try {
    await writeFile(inPath, input);
    await new Promise<void>((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-nostdin",
          "-hide_banner",
          "-loglevel",
          "error",
          "-i",
          inPath,
          "-vn", // drop any video stream; Speak clips are audio-only
          "-c:a",
          "aac",
          "-b:a",
          "96k", // voice-grade; plenty for a transcript-backed voice note
          "-movflags",
          "+faststart", // moov before mdat -> progressive playback over HTTP
          "-f",
          "mp4",
          "-y",
          outPath
        ],
        { timeout: FFMPEG_TIMEOUT_MS, killSignal: "SIGKILL" },
        (err) => (err ? reject(new CodedError("TRANSCODE_FAILED", 502)) : resolve())
      );
    });
    // Only reached when ffmpeg exited 0. Still verify the output is a real MP4
    // (the `ftyp` box sits at the start) so a truncated/partial file from an
    // edge-case exit can never be served — and cached — as valid audio.
    const out = await readFile(outPath);
    const looksLikeMp4 = out.subarray(0, 16).includes(Buffer.from("ftyp"));
    if (out.byteLength === 0 || out.byteLength > MAX_OUTPUT_BYTES || !looksLikeMp4) {
      throw new CodedError("TRANSCODE_FAILED", 502);
    }
    return out;
  } finally {
    void rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function jsonError(code: string, status: number, extra?: Record<string, string>): Response {
  // Errors must never be cached — a cached 503 BUSY or 4xx would outlive its cause.
  return Response.json(
    { error: code },
    { status, headers: { "Cache-Control": "no-store", ...extra } }
  );
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

/** Build the audio response, honouring a Range request (206/416) when present. */
function buildAudioResponse(output: Buffer, rangeHeader: string | null): Response {
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
      headers: audioHeaders({
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        "Content-Length": String(chunk.byteLength)
      })
    });
  }
  // Node Buffer isn't a DOM BodyInit; hand the Response a plain Uint8Array view.
  return new Response(new Uint8Array(output), {
    status: 200,
    headers: audioHeaders({ "Content-Length": String(size) })
  });
}

export async function GET(request: NextRequest) {
  let url: URL;
  try {
    url = parseSpeakSource(request.nextUrl.searchParams.get("src"));
  } catch (e) {
    const err = e as CodedError;
    return jsonError(err.code ?? "INVALID_SRC", err.status ?? 400);
  }

  try {
    // Fetch first (I/O, already size/timeout-capped). The concurrency cap guards
    // only the CPU-bound ffmpeg step below, so slow downloads can't starve it.
    const input = await fetchAudio(url);
    const ext = (url.pathname.match(ALLOWED_EXT)?.[0] ?? ".webm").toLowerCase();

    if (activeTranscodes >= MAX_CONCURRENT_TRANSCODES) {
      return jsonError("BUSY", 503, { "Retry-After": "2" });
    }
    activeTranscodes += 1;
    let output: Buffer;
    try {
      output = await transcodeToAac(input, ext);
    } finally {
      activeTranscodes -= 1;
    }

    return buildAudioResponse(output, request.headers.get("range"));
  } catch (e) {
    const err = e as CodedError;
    const isTimeout =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    const code = isTimeout ? "FETCH_TIMEOUT" : (err?.code ?? "TRANSCODE_FAILED");
    const status = isTimeout ? 504 : typeof err?.status === "number" ? err.status : 502;
    return jsonError(code, status);
  }
}
