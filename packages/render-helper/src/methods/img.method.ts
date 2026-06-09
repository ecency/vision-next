import { proxifyImageSrc, buildSrcSet, getProxyBase, buildPictureSources } from "../proxify-image-src";
import { trimTrailingSlash } from "../helper";

/**
 * The `sizes` value the renderer applies to in-body post images (see `img()`
 * and `createImageHTML()`). Exported as the single source of truth so consumers
 * preloading the LCP image (`<link rel="preload" as="image" imagesizes>`) can
 * match the exact srcset candidate the rendered <img> selects.
 */
export const IMAGE_SIZES = "(max-width: 768px) 100vw, 700px";

/**
 * Wrap a displayed <img> (DOM path) in a <picture> with explicit avif/webp
 * <source>s, so the browser negotiates format client-side via distinct,
 * cache-safe URLs (the format lives in the URL, not the Accept header that the
 * CDN cache ignores). No-op when the raw URL is not picture-eligible, or when
 * the <img> is already inside a <picture> (traverse can re-enter the inner <img>
 * of a string-path <picture>). Web/self-hosted only — the caller gates on
 * `forApp === false` because React Native cannot render <picture>.
 */
function wrapInPicture(el: HTMLElement, rawUrl: string): void {
  const parent = el.parentNode;
  if (!parent) return;
  if (parent.nodeName && parent.nodeName.toLowerCase() === "picture") return;
  const sources = buildPictureSources(rawUrl);
  if (!sources) return;
  const doc = el.ownerDocument;
  if (!doc) return;
  const sizes = el.getAttribute("sizes") || IMAGE_SIZES;
  const picture = doc.createElement("picture");
  const avif = doc.createElement("source");
  avif.setAttribute("type", "image/avif");
  avif.setAttribute("srcset", sources.avif);
  avif.setAttribute("sizes", sizes);
  const webp = doc.createElement("source");
  webp.setAttribute("type", "image/webp");
  webp.setAttribute("srcset", sources.webp);
  webp.setAttribute("sizes", sizes);
  // avif first — the browser picks the first <source> it supports.
  parent.insertBefore(picture, el);
  picture.appendChild(avif);
  picture.appendChild(webp);
  picture.appendChild(el);
}

export function img(el: HTMLElement, state?: { firstImageFound: boolean }, forApp = true): void {
  const src = el.getAttribute("src") || "";

  // Normalize encoded characters
  const decodedSrc = decodeURIComponent(
    src.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  ).trim();

  // Sanitize dangerous attributes regardless of validity
  ["onerror", "dynsrc", "lowsrc", "width", "height"].forEach(attr => el.removeAttribute(attr));

  // ❌ Remove if javascript or empty/invalid
  const isInvalid = !src || decodedSrc.startsWith("javascript") || decodedSrc.startsWith("vbscript") || decodedSrc === "x";
  if (isInvalid) {
    el.removeAttribute("src");
    el.removeAttribute("srcset");
    el.removeAttribute("sizes");
    return;
  }

  // ❌ Skip relative paths (e.g., `photo.jpg`, `./photo.png`, `assets/pic.jpeg`)
  // Use trimmed decodedSrc for protocol check to handle leading/trailing whitespace
  const isRelative = !/^https?:\/\//i.test(decodedSrc) && !decodedSrc.startsWith("/");
  if (isRelative) {
    el.removeAttribute("src");
    el.removeAttribute("srcset");
    el.removeAttribute("sizes");
    return;
  }

  el.setAttribute("itemprop", "image");
  const isLCP = state && !state.firstImageFound;

  if (isLCP) {
    el.setAttribute("loading", "eager");
    el.setAttribute("fetchpriority", "high");
    state.firstImageFound = true;
  } else {
    el.setAttribute("loading", "lazy");
    el.setAttribute("decoding", "async");
  }

  const cls = el.getAttribute("class") || "";
  const shouldReplace = !cls.includes("no-replace");
  // Only skip re-proxification for URLs already going through proxy/avatar/cover routes
  // Direct upload URLs (e.g. /DQm...) should still be proxified for resizing & format optimization
  const base = trimTrailingSlash(getProxyBase());
  const hasAlreadyProxied = src.startsWith(`${base}/p/`)
    || src.startsWith(`${base}/u/`)
    || new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\d+x\\d+/`).test(src);

  if (shouldReplace && !hasAlreadyProxied) {
    // forceProxy: route the fallback src through /p/ even though no width is set,
    // so uploads still get WebP/AVIF via Accept negotiation instead of the
    // original-format direct-serve bytes. (srcset carries the resized variants.)
    const proxified = proxifyImageSrc(decodedSrc, 0, 0, "match", { forceProxy: true });
    if (proxified) {
      el.setAttribute("src", proxified);
      const srcset = buildSrcSet(decodedSrc);
      if (srcset) {
        el.setAttribute("srcset", srcset);
        el.setAttribute("sizes", IMAGE_SIZES);
      }
      // Web/self-hosted: offer avif/webp via <picture>. The raw decodedSrc still
      // carries the original extension here (pre-proxify), which the eligibility
      // gate needs. The <img> above stays the format=match fallback.
      if (!forApp) {
        wrapInPicture(el, decodedSrc);
      }
    }
  } else if (shouldReplace && hasAlreadyProxied) {
    // Only /p/ URLs have extractable hashes for srcset; /u/ and /WxH/ routes
    // are avatar/cover URLs that shouldn't get responsive srcset
    if (src.startsWith(`${base}/p/`)) {
      const srcset = buildSrcSet(src);
      if (srcset) {
        el.setAttribute("srcset", srcset);
        el.setAttribute("sizes", IMAGE_SIZES);
      }
    }
  }
}

export function createImageHTML(src: string, isLCP: boolean, forApp = true): string {
  // forceProxy: see img() — keep the fallback src unsized but proxied so uploads
  // are served WebP/AVIF rather than the original-format direct-serve bytes.
  const proxified = proxifyImageSrc(src, 0, 0, "match", { forceProxy: true });
  if (!proxified) return '';

  const base = trimTrailingSlash(getProxyBase());
  const isAlreadyProxied = src.startsWith(`${base}/u/`)
    || new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\d+x\\d+/`).test(src);
  const srcset = isAlreadyProxied ? '' : buildSrcSet(src);
  const loading = isLCP ? 'eager' : 'lazy';
  const fetch = isLCP ? 'fetchpriority="high"' : 'decoding="async"';
  const srcsetAttr = srcset ? `srcset="${srcset}" sizes="${IMAGE_SIZES}"` : '';
  const imgTag = `<img
    class="markdown-img-link"
    src="${proxified}"
    ${srcsetAttr}
    loading="${loading}"
    ${fetch}
    itemprop="image"
  />`;

  // Web/self-hosted: wrap in <picture> with explicit avif/webp <source>s when
  // the raw `src` is picture-eligible. Self-closing <source/> — an explicit
  // </source> throws in the downstream xmldom re-parse. The <img> stays the
  // format=match fallback. App path (forApp) keeps the bare <img> (no <picture>
  // in React Native).
  if (!forApp) {
    const sources = buildPictureSources(src);
    if (sources) {
      return `<picture><source type="image/avif" srcset="${sources.avif}" sizes="${IMAGE_SIZES}" /><source type="image/webp" srcset="${sources.webp}" sizes="${IMAGE_SIZES}" />${imgTag}</picture>`;
    }
  }
  return imgTag;
}
