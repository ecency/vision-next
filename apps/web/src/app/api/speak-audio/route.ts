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
  constructor(public code: string, public status: number) {
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

/** True for non-globally-routable IPs (defense-in-depth against DNS rebinding). */
function isPrivateIP(ip: string): boolean {
  let normalized = ip;
  const v4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4Mapped) normalized = v4Mapped[1];

  if (isIP(normalized) === 4) {
    const [a, b, c] = normalized.split(".").map(Number);
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // RFC1918
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 192 && b === 0 && c === 0) return true; // IETF protocol
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
  const dispatcher = await resolveAndPin(url.hostname);
  try {
    const res = await fetch(url.toString(), {
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
    const out = await readFile(outPath);
    if (out.byteLength === 0 || out.byteLength > MAX_OUTPUT_BYTES) {
      throw new CodedError("TRANSCODE_FAILED", 502);
    }
    return out;
  } finally {
    void rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function GET(request: NextRequest) {
  let url: URL;
  try {
    url = parseSpeakSource(request.nextUrl.searchParams.get("src"));
  } catch (e) {
    const err = e as CodedError;
    return Response.json({ error: err.code }, { status: err.status ?? 400 });
  }

  if (activeTranscodes >= MAX_CONCURRENT_TRANSCODES) {
    return Response.json(
      { error: "BUSY" },
      { status: 503, headers: { "Retry-After": "2" } }
    );
  }

  activeTranscodes += 1;
  try {
    const input = await fetchAudio(url);
    const ext = (url.pathname.match(ALLOWED_EXT)?.[0] ?? ".webm").toLowerCase();
    const output = await transcodeToAac(input, ext);

    // Node Buffer isn't a DOM BodyInit; hand the Response a plain Uint8Array view.
    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": "audio/mp4",
        "Content-Length": String(output.byteLength),
        "Cache-Control": AUDIO_CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (e) {
    const err = e as CodedError;
    const status = typeof err?.status === "number" ? err.status : 502;
    const code =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
        ? "FETCH_TIMEOUT"
        : err?.code ?? "TRANSCODE_FAILED";
    // Never let an error response get cached.
    return Response.json(
      { error: code },
      { status: code === "FETCH_TIMEOUT" ? 504 : status, headers: { "Cache-Control": "no-store" } }
    );
  } finally {
    activeTranscodes -= 1;
  }
}
