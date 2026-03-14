import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { NextRequest } from "next/server";
import Turndown from "turndown";

const HIVE_FRONT_ENDS = [
  "ecency.com",
  "hive.blog",
  "peakd.com",
  "leofinance.io",
  "inleo.io"
];

function parseHiveUrl(url: string): { author: string; permlink: string } | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");

    if (!HIVE_FRONT_ENDS.some((fe) => hostname.endsWith(fe))) {
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

async function fetchHivePost(author: string, permlink: string) {
  const response = await fetch("https://api.hive.blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "bridge.get_post",
      params: { author, permlink },
      id: 1
    })
  });

  const data = await response.json();
  const post = data?.result;

  if (!post || !post.body) {
    return null;
  }

  return {
    title: post.title || "",
    content: post.body || "",
    thumbnail: post.json_metadata?.image?.[0] || "",
    tags: post.json_metadata?.tags || [],
    source: "hive" as const
  };
}

async function fetchPage(url: string): Promise<Response> {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache"
  };

  const response = await fetch(url, {
    headers,
    redirect: "follow",
    signal: AbortSignal.timeout(15000)
  });

  return response;
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

async function fetchExternalArticle(url: string) {
  const response = await fetchPage(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new Error("URL does not point to an HTML page");
  }

  const html = await response.text();
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
    throw new Error("Could not extract article content from the page");
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
    tags: [] as string[],
    source: "external" as const
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Check if it's a Hive post URL
    const hivePost = parseHiveUrl(url);
    if (hivePost) {
      const result = await fetchHivePost(hivePost.author, hivePost.permlink);
      if (!result) {
        return Response.json(
          { error: "Hive post not found" },
          { status: 404 }
        );
      }
      return Response.json(result);
    }

    // External article
    const result = await fetchExternalArticle(url);
    return Response.json(result);
  } catch (e: any) {
    return Response.json(
      { error: e.message || "Failed to import article" },
      { status: 500 }
    );
  }
}
