import { proxifyImageSrc } from "../proxify-image-src";

export function img(el: HTMLElement, state?: { firstImageFound: boolean }): void {
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
    return;
  }

  // ❌ Skip relative paths (e.g., `photo.jpg`, `./photo.png`, `assets/pic.jpeg`)
  // Use trimmed decodedSrc for protocol check to handle leading/trailing whitespace
  const isRelative = !/^https?:\/\//i.test(decodedSrc) && !decodedSrc.startsWith("/");
  if (isRelative) {
    el.removeAttribute("src");
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
  const hasAlreadyProxied = src.startsWith("https://images.ecency.com/p/")
    || src.startsWith("https://images.ecency.com/u/")
    || /^https:\/\/images\.ecency\.com\/\d+x\d+\//.test(src);

  if (shouldReplace && !hasAlreadyProxied) {
    const proxified = proxifyImageSrc(decodedSrc);
    if (proxified) {
      el.setAttribute("src", proxified);
    }
  }
}

export function createImageHTML(src: string, isLCP: boolean): string {
  const proxified = proxifyImageSrc(src);
  if (!proxified) return '';

  const loading = isLCP ? 'eager' : 'lazy';
  const fetch = isLCP ? 'fetchpriority="high"' : 'decoding="async"';
  return `<img
    class="markdown-img-link"
    src="${proxified}"
    loading="${loading}"
    ${fetch}
    itemprop="image"
  />`;
}
