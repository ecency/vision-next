import { DOMParser } from './consts'
import type { Document } from '@xmldom/xmldom'

/**
 * Removes duplicate attributes from HTML tags.
 * @xmldom/xmldom 0.9+ throws fatalError on duplicate attributes (e.g., <iframe allowfullscreen allowfullscreen>).
 *
 * Single-pass tokenizer. The previous regex-based implementation had
 * catastrophic backtracking on malformed inputs such as
 *   <div style=background-color:yellow;">
 * (unquoted attribute value followed by a stray quote, no closing `>` for the
 * tag in the immediate vicinity). The nested alternation
 *   (?:[^>"']+|"[^"]*"|'[^']*')*?
 * combined with a greedy `+` inside the non-greedy `*?` produced O(n²+)
 * backtracking that pinned a 6 KB body for >30 seconds, tripping the watchdog
 * and killing the container.
 */
function isSpaceChar(c: number): boolean {
  return c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d || c === 0x0c
}

function isAsciiLetter(c: number): boolean {
  return (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a)
}

function isTagNameChar(c: number): boolean {
  return isAsciiLetter(c) || (c >= 0x30 && c <= 0x39)
}

function isAttrNameChar(c: number): boolean {
  // a-zA-Z, 0-9, '-', '_', ':', '.'
  return (
    isAsciiLetter(c) ||
    (c >= 0x30 && c <= 0x39) ||
    c === 0x2d ||
    c === 0x5f ||
    c === 0x3a ||
    c === 0x2e
  )
}

export function removeDuplicateAttributes(html: string): string {
  const n = html.length
  let out = ''
  let i = 0

  while (i < n) {
    const lt = html.indexOf('<', i)
    if (lt < 0) {
      out += html.slice(i)
      break
    }
    out += html.slice(i, lt)

    // Only opening tags that start with an ASCII letter and have at least
    // one whitespace before the attributes are normalised — matches the
    // scope of the prior regex (closing tags, comments, doctypes, and bare
    // `<` characters are left untouched).
    if (lt + 1 >= n || !isAsciiLetter(html.charCodeAt(lt + 1))) {
      out += '<'
      i = lt + 1
      continue
    }

    let p = lt + 1
    while (p < n && isTagNameChar(html.charCodeAt(p))) p++
    const tagName = html.slice(lt + 1, p)

    if (p >= n || !isSpaceChar(html.charCodeAt(p))) {
      out += '<'
      i = lt + 1
      continue
    }

    const attrs: string[] = []
    const seen = new Set<string>()
    let q = p

    while (q < n) {
      while (q < n && isSpaceChar(html.charCodeAt(q))) q++
      if (q >= n) break

      const ch = html.charCodeAt(q)
      if (ch === 0x3e) break // '>'
      if (ch === 0x2f && q + 1 < n && html.charCodeAt(q + 1) === 0x3e) break // '/>'

      const nameStart = q
      while (q < n && isAttrNameChar(html.charCodeAt(q))) q++
      if (q === nameStart) {
        // Stray character that can't start an attribute name. Skip it so
        // we make progress; the original tag bytes are preserved verbatim
        // below if we ultimately can't close the tag.
        q++
        continue
      }
      const attrName = html.slice(nameStart, q)

      let r = q
      while (r < n && isSpaceChar(html.charCodeAt(r))) r++

      let valueEnd = q
      if (r < n && html.charCodeAt(r) === 0x3d /* '=' */) {
        r++
        while (r < n && isSpaceChar(html.charCodeAt(r))) r++
        if (r < n) {
          const v = html.charCodeAt(r)
          if (v === 0x22 || v === 0x27) {
            // Quoted value
            const quote = html[r]
            const end = html.indexOf(quote, r + 1)
            if (end < 0) {
              // Unterminated quote — bail to the next `>` to avoid eating
              // the rest of the document.
              const gt = html.indexOf('>', r + 1)
              valueEnd = gt < 0 ? n : gt
            } else {
              valueEnd = end + 1
            }
          } else {
            // Unquoted value: read until whitespace or `>`
            let s = r
            while (s < n) {
              const k = html.charCodeAt(s)
              if (isSpaceChar(k) || k === 0x3e) break
              s++
            }
            valueEnd = s
          }
        } else {
          valueEnd = r
        }
      }

      const fullAttr = html.slice(nameStart, valueEnd)
      q = valueEnd

      const key = attrName.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        attrs.push(fullAttr)
      }
    }

    let selfClose = false
    if (q < n && html.charCodeAt(q) === 0x2f /* '/' */) {
      selfClose = true
      q++
    }
    if (q >= n || html.charCodeAt(q) !== 0x3e /* '>' */) {
      // Unterminated tag — leave the original input alone past the `<` and
      // continue scanning. This mirrors the prior regex's behaviour of not
      // matching such fragments.
      out += '<'
      i = lt + 1
      continue
    }
    q++

    const attrsJoined = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
    out += '<' + tagName + attrsJoined + (selfClose ? ' /' : '') + '>'
    i = q
  }

  return out
}

export function createDoc(html: string): Document | null {
  if (html.trim() === '') {
    return null
  }

  // Preprocess to remove duplicate attributes which cause @xmldom/xmldom 0.9+ to throw fatalError
  const cleanedHtml = removeDuplicateAttributes(html)

  // Wrap in body tag to handle multiple root elements
  // This is needed because markdownToHTML can generate multiple top-level elements
  // (e.g., <center>...</center><hr />) which DOMParser doesn't accept without a wrapper
  // Using <body> instead of <div> prevents conflicts with <div> elements in the content
  //
  // @xmldom/xmldom 0.9+ always throws a ParseError from its internal fatalError() path
  // (see dom-parser.js:490) for severely malformed HTML — e.g., mismatched tags like
  // <body>...<p>...</body> — regardless of the onError handler returning undefined.
  // The onError handler only gets to observe; the throw still happens.
  //
  // Wrap in try/catch so that pathologically-malformed post bodies degrade gracefully
  // (no image preload hint) instead of crashing the SSR render of /entry/[...]. Both
  // callers in catch-post-image.ts already handle a null return.
  try {
    return DOMParser.parseFromString(`<body>${cleanedHtml}</body>`, 'text/html')
  } catch {
    return null
  }
}

export function makeEntryCacheKey(entry: any): string {
  return `${entry.author}-${entry.permlink}-${entry.last_update}-${entry.updated}`
}

/**
 * Linear-time HTML-tag stripper. Replaces the regex
 *   /(<([^>]+)>)/gi
 * which `regexp/no-super-linear-move` flags as quadratic on inputs with
 * many `<`s that never close. Mirrors the regex's behaviour: matches
 * `<tag...>` with at least one character between the angle brackets and
 * removes it, but leaves bare `<` (with no `>` to close it) and `<>`
 * (empty content) in place.
 */
export function stripHtmlTags(s: string): string {
  const n = s.length
  let out = ''
  let i = 0
  while (i < n) {
    const lt = s.indexOf('<', i)
    if (lt < 0) {
      out += s.slice(i)
      break
    }
    out += s.slice(i, lt)
    const gt = s.indexOf('>', lt + 1)
    if (gt < 0) {
      // Unclosed `<` — original regex required a `>` to match, so keep
      // the remaining text intact.
      out += s.slice(lt)
      break
    }
    if (gt === lt + 1) {
      // `<>` empty — original `[^>]+` required at least one inner char,
      // so preserve the literal `<>`.
      out += s.slice(lt, gt + 1)
      i = gt + 1
      continue
    }
    i = gt + 1
  }
  return out
}

/**
 * Linear-time trailing-`/` strip. Replaces the regex
 *   /\/+$/
 * which `regexp/no-super-linear-move` flags as quadratic on inputs
 * that end in a long run of slashes followed by anything else (the
 * engine retries at every starting position).
 */
export function trimTrailingSlash(s: string): string {
  let end = s.length
  while (end > 0 && s.charCodeAt(end - 1) === 0x2f /* '/' */) end--
  return s.slice(0, end)
}

/**
 * Linear-time query-string strip. Replaces the regex
 *   /\?.+$/
 * with a simple `indexOf` + `slice`. Matches the regex's behaviour:
 * strips only if `?` exists *and* at least one character follows it
 * (`?` at end-of-string leaves the input unchanged).
 */
export function stripQueryString(s: string): string {
  const q = s.indexOf('?')
  return q >= 0 && q < s.length - 1 ? s.slice(0, q) : s
}

export function extractYtStartTime(url:string):string {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    if(params.has('t')){
      const t = params.get('t');
      return '' + parseInt(t || '0'); //parsing is important as sometimes t is famated '123s';
    }else if (params.has('start')){
      return params.get('start') || '';
    }
    return '';
  } catch (error) {
    return '';
  }
}
export function sanitizePermlink(permlink: string): string {
  if (!permlink || typeof permlink !== 'string') {
    return ''
  }

  const [withoutQuery] = permlink.split('?')
  const [cleaned] = withoutQuery.split('#')

  return cleaned
}

export function isValidPermlink(permlink: string): boolean {
  const sanitized = sanitizePermlink(permlink)

  if (!sanitized) {
    return false
  }

  // Should not contain image extensions, query params, or fragments
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(sanitized)
  const isCleanFormat = /^[a-z0-9-]+$/.test(sanitized) // Hive standard

  return isCleanFormat && !isImage
}

// Reference: https://en.wikipedia.org/wiki/Domain_Name_System#Domain_name_syntax
// Hive account names must follow similar rules to DNS (RFC 1035)
const LABEL_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  if (username.length > 16) return false;

  const labels = username.split('.');

  return labels.every(label => {
    return (
      label.length >= 3 &&
      label.length <= 16 &&
      /^[a-z]/.test(label) &&                    // must start with a letter
      LABEL_REGEX.test(label) &&                 // a-z0-9, hyphens, no start/end hyphen
      !label.includes('..')                      // double dots are impossible after split, but just in case
    );
  });
}



