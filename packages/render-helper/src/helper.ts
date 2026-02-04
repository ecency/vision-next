import { DOMParser } from './consts'
import type { Document } from '@xmldom/xmldom'

/**
 * Removes duplicate attributes from HTML tags.
 * @xmldom/xmldom 0.9+ throws fatalError on duplicate attributes (e.g., <iframe allowfullscreen allowfullscreen>).
 * This preprocessor keeps only the first occurrence of each attribute.
 */
export function removeDuplicateAttributes(html: string): string {
  // Match opening tags with attributes, capturing optional self-closing slash
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)\s*(\/?)>/g, (match, tagName, attrsString, selfClose) => {
    const seenAttrs = new Set<string>()
    const cleanedAttrs: string[] = []

    // Match individual attributes (name="value", name='value', name=value, or just name)
    const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"[^"]*"|'[^']*'|[^\s/>]+))?/g
    let attrMatch

    while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
      const attrName = attrMatch[1].toLowerCase()
      if (!seenAttrs.has(attrName)) {
        seenAttrs.add(attrName)
        cleanedAttrs.push(attrMatch[0])
      }
    }

    const attrsJoined = cleanedAttrs.length > 0 ? ` ${cleanedAttrs.join(' ')}` : ''
    return `<${tagName}${attrsJoined}${selfClose ? ' /' : ''}>`
  })
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
  const doc = DOMParser.parseFromString(`<body>${cleanedHtml}</body>`, 'text/html')

  return doc
}

export function makeEntryCacheKey(entry: any): string {
  return `${entry.author}-${entry.permlink}-${entry.last_update}-${entry.updated}`
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



