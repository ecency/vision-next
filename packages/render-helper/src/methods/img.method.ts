import { proxifyImageSrc } from "../proxify-image-src";

export function img(el: HTMLElement, webp: boolean, state?: { firstImageFound: boolean }): void {
  let src = el.getAttribute("src") || "";

  // Normalize encoded characters
  const decodedSrc = decodeURIComponent(
    src.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  ).trim();

  // ❌ Remove if javascript or empty/invalid
  const isInvalid = !src || decodedSrc.startsWith("javascript") || decodedSrc.startsWith("vbscript") || decodedSrc === "x";
  if (isInvalid) {
    src = ""
  }

  // ❌ Skip relative paths (e.g., `photo.jpg`, `./photo.png`, `assets/pic.jpeg`)
  // Use trimmed decodedSrc for protocol check to handle leading/trailing whitespace
  const isRelative = !/^https?:\/\//i.test(decodedSrc) && !decodedSrc.startsWith("/");
  if (isRelative) {
    //console.warn("Skipped relative image:", src);
    src = ""
  }

  // Sanitize any dynamic or low-res src-like attributes
  ["onerror", "dynsrc", "lowsrc", "width", "height"].forEach(attr => el.removeAttribute(attr));

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
  const hasAlreadyProxied = src.startsWith("https://images.ecency.com");

  if (shouldReplace && !hasAlreadyProxied) {
    const proxified = proxifyImageSrc(src, 0, 0, webp ? "webp" : "match");
    el.setAttribute("src", proxified);
  }
}

export function createImageHTML(src: string, isLCP: boolean, webp: boolean): string {
  const loading = isLCP ? 'eager' : 'lazy';
  const fetch = isLCP ? 'fetchpriority="high"' : 'decoding="async"';
  const proxified = proxifyImageSrc(src, 0, 0, webp ? 'webp' : 'match');
  return `<img
    class="markdown-img-link"
    src="${proxified}"
    loading="${loading}"
    ${fetch}
    itemprop="image"
  />`;
}
