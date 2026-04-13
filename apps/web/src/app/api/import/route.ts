import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { NextRequest } from "next/server";
import Turndown from "turndown";
import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";
import { getPost } from "@ecency/sdk";

interface ArticleData {
  title: string;
  content: string;
  thumbnail: string;
  tags: string[];
  source: "hive" | "external";
}

const HIVE_FRONT_ENDS = [
  "ecency.com",
  "hive.blog",
  "peakd.com",
  "leofinance.io",
  "inleo.io"
];

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Expand an IPv6 address to its full 8-group, zero-padded form.
 * e.g. "2001:db8::1" → "2001:0db8:0000:0000:0000:0000:0000:0001"
 */
function expandIPv6(ip: string): string {
  const halves = ip.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length > 1 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  const mid = Array(missing > 0 ? missing : 0).fill("0000");
  const full = [...left, ...mid, ...right];
  return full.map((g) => g.padStart(4, "0")).join(":");
}

/**
 * Check if an IP address (v4 or v6) falls within non-globally-routable ranges.
 * Handles all representations including IPv4-mapped IPv6 (::ffff:x.x.x.x).
 */
function isPrivateIP(ip: string): boolean {
  let normalized = ip;
  const v4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4Mapped) {
    normalized = v4Mapped[1];
  }
  const v4MappedHex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (v4MappedHex) {
    const high = parseInt(v4MappedHex[1], 16);
    const low = parseInt(v4MappedHex[2], 16);
    normalized = `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`;
  }

  if (isIP(normalized) === 4) {
    const parts = normalized.split(".").map(Number);
    const [a, b, c] = parts;
    if (a === 0) return true;                          // 0.0.0.0/8 — "this" network
    if (a === 10) return true;                         // 10.0.0.0/8 — RFC1918
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 — CGNAT
    if (a === 127) return true;                        // 127.0.0.0/8 — loopback
    if (a === 169 && b === 254) return true;           // 169.254.0.0/16 — link-local
    if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12 — RFC1918
    if (a === 192 && b === 0 && c === 0) return true;  // 192.0.0.0/24 — IETF protocol
    if (a === 192 && b === 0 && c === 2) return true;  // 192.0.2.0/24 — TEST-NET-1
    if (a === 192 && b === 88 && c === 99) return true; // 192.88.99.0/24 — 6to4 relay
    if (a === 192 && b === 168) return true;           // 192.168.0.0/16 — RFC1918
    if (a === 198 && b >= 18 && b <= 19) return true;  // 198.18.0.0/15 — benchmark
    if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 — TEST-NET-2
    if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 — TEST-NET-3
    if (a >= 224) return true;                         // 224.0.0.0+ — multicast & reserved
    return false;
  }

  if (isIP(normalized) === 6) {
    // Expand to full 8-group form for reliable prefix matching
    const full = expandIPv6(normalized);
    if (full === "0000:0000:0000:0000:0000:0000:0000:0000") return true; // :: unspecified
    if (full === "0000:0000:0000:0000:0000:0000:0000:0001") return true; // ::1 loopback
    const g1 = parseInt(full.slice(0, 4), 16);
    if (g1 >= 0xfc00 && g1 <= 0xfdff) return true; // fc00::/7 — ULA
    if ((g1 & 0xffc0) === 0xfe80) return true;        // fe80::/10 — link-local
    if (full.startsWith("2001:0db8")) return true;  // 2001:db8::/32 — documentation
    if (full.startsWith("2001:0000")) return true;  // 2001::/32 — Teredo
    if (full.startsWith("0100:0000:0000:0000")) return true; // 100::/64 — discard
    if (g1 >= 0xff00) return true;                  // ff00::/8 — multicast
    return false;
  }

  return true;
}

function assertPublicIP(ip: string) {
  if (isPrivateIP(ip)) {
    throw new Error("BLOCKED_HOST");
  }
}

/**
 * Validate a URL by resolving its hostname via DNS and checking that every
 * returned IP (A + AAAA) is public. This catches private-IP hostnames,
 * IPv4-mapped IPv6, and domains that have any record pointing to an internal
 * address. Throws on failure.
 *
 * Note: we intentionally fetch with the original hostname (not a pinned IP)
 * to preserve TLS certificate validation and SNI on HTTPS targets. This
 * leaves a small theoretical TOCTOU window for DNS rebinding, which is an
 * accepted trade-off — the attacker would need to control the target domain's
 * DNS and trick a user into importing from that domain.
 */
async function validateUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("INVALID_PROTOCOL");
  }

  const hostname = parsed.hostname.replace(/^\[/, "").replace(/\]$/, "");

  if (hostname.toLowerCase() === "localhost") {
    throw new Error("BLOCKED_HOST");
  }

  // If hostname is already an IP literal, validate directly
  if (isIP(hostname)) {
    assertPublicIP(hostname);
    return;
  }

  // Resolve ALL DNS records and validate every one
  const resolver = new Resolver();
  const [v4Records, v6Records] = await Promise.all([
    resolver.resolve4(hostname).catch(() => [] as string[]),
    resolver.resolve6(hostname).catch(() => [] as string[])
  ]);

  const allIPs = [...v4Records, ...v6Records];
  if (allIPs.length === 0) {
    throw new Error("BLOCKED_HOST");
  }

  // Block if any record resolves to a private/reserved range
  for (const ip of allIPs) {
    assertPublicIP(ip);
  }
}

function parseHiveUrl(url: string): { author: string; permlink: string } | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");

    if (!HIVE_FRONT_ENDS.some((fe) => hostname === fe || hostname.endsWith("." + fe))) {
      return null;
    }

    // Patterns: /@author/permlink or /category/@author/permlink
    const segments = parsed.pathname.split("/").filter(Boolean);

    for (let i = 0; i < segments.length; i++) {
      if (segments[i].startsWith("@") && segments[i + 1]) {
        return {
          author: segments[i].replace("@", ""),
          permlink: segments[i + 1]
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchHivePost(author: string, permlink: string): Promise<ArticleData | null> {
  const post = await getPost(author, permlink);

  if (!post || !post.body) {
    return null;
  }

  return {
    title: post.title || "",
    content: post.body || "",
    thumbnail: post.json_metadata?.image?.[0] || "",
    tags: post.json_metadata?.tags || [],
    source: "hive"
  };
}

/**
 * Fetch a page with size-limited streaming, timeout, and redirect host validation.
 * Each redirect hop is validated via DNS resolution before following.
 */
const MAX_REDIRECTS = 5;

async function fetchPage(url: string, redirectCount = 0): Promise<string> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error("FETCH_FAILED");
  }

  await validateUrl(url);

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache"
    },
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });

  // Handle redirects manually to validate each hop
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    if (!location) {
      throw new Error("FETCH_FAILED");
    }
    const redirectUrl = new URL(location, url).toString();
    return fetchPage(redirectUrl, redirectCount + 1);
  }

  if (!response.ok) {
    throw new Error("FETCH_FAILED");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new Error("NOT_HTML");
  }

  // Stream body with size cap
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("FETCH_FAILED");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      reader.cancel();
      throw new Error("RESPONSE_TOO_LARGE");
    }
    chunks.push(value);
  }

  const decoder = new TextDecoder();
  return chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join("") +
    decoder.decode();
}

/**
 * Pre-process HTML before Readability to fix lazy-loaded images.
 * Many sites (Medium, Substack, etc.) use data-src, srcset, or
 * <noscript> wrappers instead of plain <img src>.
 */
function fixLazyImages(document: Document) {
  // 1. Unwrap <noscript> images — many sites hide the real <img> inside <noscript>
  for (const noscript of Array.from(document.querySelectorAll("noscript"))) {
    const content = noscript.textContent || "";
    if (/<img\s/i.test(content)) {
      const wrapper = document.createElement("div");
      // Safe: server-side JSDOM with no script execution — recovers real <img> from noscript blocks
      wrapper.innerHTML = content;
      noscript.parentNode?.replaceChild(wrapper, noscript);
    }
  }

  // 2. Resolve data-src, data-original, data-lazy-src → src
  for (const img of Array.from(document.querySelectorAll("img"))) {
    const lazySrc =
      img.getAttribute("data-src") ||
      img.getAttribute("data-original") ||
      img.getAttribute("data-lazy-src");

    if (lazySrc && (!img.getAttribute("src") || img.getAttribute("src")?.startsWith("data:"))) {
      img.setAttribute("src", lazySrc);
    }

    // 3. Pick highest-res from srcset if src is missing or a placeholder
    const srcset = img.getAttribute("srcset");
    if (srcset && (!img.getAttribute("src") || img.getAttribute("src")?.startsWith("data:"))) {
      const best = srcset
        .split(",")
        .map((s) => s.trim().split(/\s+/))
        .sort((a, b) => {
          const widthA = parseInt(a[1] || "0");
          const widthB = parseInt(b[1] || "0");
          return widthB - widthA;
        })[0];
      if (best?.[0]) {
        img.setAttribute("src", best[0]);
      }
    }

    // 4. Remove tiny tracking pixels / spacer gifs
    const src = img.getAttribute("src") || "";
    const width = parseInt(img.getAttribute("width") || "0");
    const height = parseInt(img.getAttribute("height") || "0");
    if ((width > 0 && width < 3) || (height > 0 && height < 3) || src.includes("stat.") || src.includes("/pixel")) {
      img.remove();
    }
  }
}

async function fetchExternalArticle(url: string): Promise<ArticleData> {
  const html = await fetchPage(url);
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;

  // Extract metadata before Readability modifies the DOM
  const ogImage =
    document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content") || "";

  // Extract publish date from common meta tags
  const publishDate =
    document.querySelector('meta[property="article:published_time"]')?.getAttribute("content") ||
    document.querySelector('meta[name="date"]')?.getAttribute("content") ||
    document.querySelector('meta[name="publish_date"]')?.getAttribute("content") ||
    document.querySelector('meta[property="og:article:published_time"]')?.getAttribute("content") ||
    document.querySelector("time[datetime]")?.getAttribute("datetime") ||
    "";

  // Fix lazy-loaded images before extraction
  fixLazyImages(document);

  const reader = new Readability(document);
  const article = reader.parse();

  if (!article) {
    throw new Error("EXTRACT_FAILED");
  }

  // Convert extracted HTML to markdown for editor compatibility
  const turndown = new Turndown({
    headingStyle: "atx",
    codeBlockStyle: "fenced"
  });
  let markdown = turndown.turndown(article.content || "");

  // Prepend og:image as hero image if the body doesn't already contain it
  if (ogImage && !markdown.includes(ogImage)) {
    markdown = `![](${ogImage})\n\n${markdown}`;
  }

  // Append source attribution with publish date
  const hostname = new URL(url).hostname.replace("www.", "");
  let datePart = "";
  if (publishDate) {
    const parsed = new Date(publishDate);
    if (!isNaN(parsed.getTime())) {
      datePart = ` on ${parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
    }
  }
  markdown += `\n\n---\n*Originally published on [${hostname}](${url})${datePart}*\n`;

  return {
    title: article.title || "",
    content: markdown,
    thumbnail: ogImage,
    tags: [],
    source: "external"
  };
}

const ERROR_CODES: Record<string, string> = {
  INVALID_PROTOCOL: "import-error-invalid-url",
  BLOCKED_HOST: "import-error-invalid-url",
  FETCH_FAILED: "import-error-fetch-failed",
  NOT_HTML: "import-error-not-html",
  RESPONSE_TOO_LARGE: "import-error-too-large",
  EXTRACT_FAILED: "import-error-extract-failed"
};

const ERROR_STATUS: Record<string, number> = {
  INVALID_PROTOCOL: 400,
  BLOCKED_HOST: 400,
  NOT_HTML: 415,
  RESPONSE_TOO_LARGE: 413
};

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "import-error-invalid-url" }, { status: 400 });
    }

    const url = (body as Record<string, unknown>)?.url;

    if (!url || typeof url !== "string") {
      return Response.json({ error: "import-error-invalid-url" }, { status: 400 });
    }

    try {
      await validateUrl(url);
    } catch {
      return Response.json({ error: "import-error-invalid-url" }, { status: 400 });
    }

    // Check if it's a Hive post URL
    const hivePost = parseHiveUrl(url);
    if (hivePost) {
      const result = await fetchHivePost(hivePost.author, hivePost.permlink);
      if (!result) {
        return Response.json(
          { error: "import-error-not-found" },
          { status: 404 }
        );
      }
      return Response.json(result);
    }

    // External article
    const result = await fetchExternalArticle(url);
    return Response.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "";
    const code = ERROR_CODES[message] || "import-failed";
    const status = ERROR_STATUS[message] || 500;
    return Response.json({ error: code }, { status });
  }
}
