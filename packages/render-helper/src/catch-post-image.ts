import { proxifyImageSrc } from './proxify-image-src'
import { markdown2Html } from './markdown-2-html'
import { createDoc, makeEntryCacheKey } from './helper'
import { cacheGet, cacheSet } from './cache'
import { Entry } from './types'
import he from 'he'

const gifLinkRegex = /\.(gif)$/i;

function isGifLink(link: string) {
  return gifLinkRegex.test(link);
}

// Strip code regions so that ![alt](url) inside a code block is not mistaken
// for a real image. The full markdown renderer turns these into <pre><code>
// with no <img>, so we mirror that behavior here.
//   - backtick fences ``` … ``` (with optional language hint)
//   - tilde fences ~~~ … ~~~ (CommonMark also accepts these)
//   - inline code `…`
//   - indented code blocks (4 spaces or a tab at line start) — over-strips
//     a little (e.g., deeply nested list continuation lines), which is fine:
//     a missed match just falls back to the full parser.
const BACKTICK_FENCE_RE = /```[\s\S]*?```/g
const TILDE_FENCE_RE = /~~~[\s\S]*?~~~/g
const INLINE_CODE_RE = /`[^`\n]*`/g
const INDENTED_CODE_RE = /^(?: {4}|\t).+$/gm
// Requires a closing `)` so broken syntax like `![](url` (no close) doesn't
// match. Also tolerates the optional title form `![](url "title")`.
const MD_IMAGE_RE = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/
const HTML_IMAGE_RE = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i

// The fast-path bypasses sanitize-html (which the full markdown pipeline
// applies). The sanitizer only preserves http/https <img> sources — ftp,
// data, javascript, relative, etc. are all dropped. Mirror that policy here
// so the fast-path can never surface an image the full path would have
// dropped. Anything else returns null and falls back to the sanitized parse.
const SAFE_URL_RE = /^https?:\/\//i

/**
 * Fast-path: extract the first image URL from raw markdown without rendering
 * the whole post. Returns null if nothing matches *unambiguously* — when in
 * doubt, the caller falls back to the full markdown2Html → DOM parse path.
 */
function findFirstImageUrl(body: string): string | null {
  if (!body) return null
  const cleaned = body
    .replace(BACKTICK_FENCE_RE, '')
    .replace(TILDE_FENCE_RE, '')
    .replace(INLINE_CODE_RE, '')
    .replace(INDENTED_CODE_RE, '')

  const mdMatch = cleaned.match(MD_IMAGE_RE)
  const htmlMatch = cleaned.match(HTML_IMAGE_RE)

  // If markdown image syntax is present at all, it must be unambiguous. The
  // capture class `[^)\s]+` excludes `)`, so a captured URL containing `(`
  // means the URL was truncated mid-paren (e.g., a real
  // `https://x.com/path_(a)_full.jpg`). When ambiguous, bail and let the full
  // markdown parser handle it — returning a truncated URL would be wrong.
  if (mdMatch) {
    const url = mdMatch[1]
    if (!url || !SAFE_URL_RE.test(url) || url.includes('(')) {
      return null
    }
  }

  const mdValid = !!mdMatch
  const htmlValid = !!(htmlMatch && htmlMatch[1] && SAFE_URL_RE.test(htmlMatch[1]))

  // Pick the earliest match in source order — the full markdown render would
  // surface whichever <img> appears first in the rendered document.
  if (mdValid && htmlValid) {
    return (mdMatch!.index ?? 0) < (htmlMatch!.index ?? 0) ? mdMatch![1] : htmlMatch![1]
  }
  if (mdValid) return mdMatch![1]
  if (htmlValid) return htmlMatch![1]
  return null
}

function proxifyFound(src: string, width: number, height: number, format: string): string {
  const decoded = he.decode(src)
  if (isGifLink(decoded)) {
    return proxifyImageSrc(decoded, 0, 0, format)
  }
  return proxifyImageSrc(decoded, width, height, format)
}

function getImage(entry: Entry, width = 0, height = 0, format = 'match'): string | null {
  /*
  * Return from json metadata if exists
  * */
  let meta: Entry['json_metadata'] | null

  if (typeof entry.json_metadata === 'object') {
    meta = entry.json_metadata
  } else {
    try {
      meta = JSON.parse(entry.json_metadata as string)
    } catch (e) {
      meta = null
    }
  }

  if (meta && typeof meta.image === 'string' && meta.image.length > 0) {
    // Decode HTML entities (e.g., &amp; -> &) before proxifying
    const decodedImage = he.decode(meta.image)
    if (isGifLink(decodedImage)) {
      return proxifyImageSrc(decodedImage, 0, 0, format)
    }
    return proxifyImageSrc(decodedImage, width, height, format)
  }

  if (meta && meta.image && !!meta.image.length && meta.image[0]) {
    // Only decode if it's a string, otherwise pass through to proxifyImageSrc which will return ''
    if (typeof meta.image[0] === 'string') {
      // Decode HTML entities (e.g., &amp; -> &) before proxifying
      const decodedImage = he.decode(meta.image[0])
      if (isGifLink(decodedImage)) {
        return proxifyImageSrc(decodedImage, 0, 0, format)
      }
      return proxifyImageSrc(decodedImage, width, height, format)
    }
    // For non-string types, let proxifyImageSrc handle it (returns '')
    if (isGifLink(meta.image[0])) {
      return proxifyImageSrc(meta.image[0], 0, 0, format)
    }
    return proxifyImageSrc(meta.image[0], width, height, format)
  }

  // Fast-path: try to find the first image with a regex over the raw body.
  // Avoids the cost of full markdown2Html + DOM parsing for the common case.
  const fast = findFirstImageUrl(entry.body)
  if (fast) {
    return proxifyFound(fast, width, height, format)
  }

  // Fall back to the full markdown render (handles edge cases the regex missed)
  const html = markdown2Html(entry)
  const doc = createDoc(html)
  if (!doc) {
    return null
  }

  const imgEls = doc.getElementsByTagName('img')
  if (imgEls.length >= 1) {
    const src = imgEls[0].getAttribute('src')
    if (!src) {
      return null
    }
    return proxifyFound(src, width, height, format)
  }

  return null
}

/**
 * The RAW (pre-proxify) URL of an entry's primary image, using the same
 * discovery order as catchPostImage (json_metadata.image, then the first body
 * image). Unlike catchPostImage it does NOT proxify — callers need the original
 * URL (e.g. to test picture-eligibility for an LCP preload, since catchPostImage
 * returns an already-proxified /p/ URL). Returns null when the fast path finds
 * no unambiguous image (the caller can fall back to catchPostImage).
 */
export function getEntryImageRawUrl(obj: Entry | string): string | null {
  if (typeof obj === 'string') {
    return findFirstImageUrl(obj)
  }
  let meta: Entry['json_metadata'] | null
  if (typeof obj.json_metadata === 'object') {
    meta = obj.json_metadata
  } else {
    try {
      meta = JSON.parse(obj.json_metadata as string)
    } catch (e) {
      meta = null
    }
  }
  if (meta && typeof meta.image === 'string' && meta.image.length > 0) {
    return he.decode(meta.image)
  }
  if (meta && meta.image && !!meta.image.length && typeof meta.image[0] === 'string') {
    return he.decode(meta.image[0])
  }
  return findFirstImageUrl(obj.body)
}

export function catchPostImage(obj: Entry | string, width = 0, height = 0, format = 'match'): string | null {
  if (typeof obj === 'string') {
    // Process string directly to avoid cache key collision
    // Don't create Entry wrapper as it would generate invalid cache keys

    // Fast-path: regex over raw markdown
    const fast = findFirstImageUrl(obj)
    if (fast) {
      return proxifyFound(fast, width, height, format)
    }

    const html = markdown2Html(obj)
    const doc = createDoc(html)
    if (!doc) {
      return null
    }

    const imgEls = doc.getElementsByTagName('img')
    if (imgEls.length >= 1) {
      const src = imgEls[0].getAttribute('src')
      if (!src) {
        return null
      }
      return proxifyFound(src, width, height, format)
    }

    return null
  }
  const key = `${makeEntryCacheKey(obj)}-${width}x${height}-${format}`

  const item = cacheGet<string | null>(key)
  if (item) {
    return item
  }

  const res = getImage(obj, width, height, format)
  cacheSet(key, res)

  return res
}

