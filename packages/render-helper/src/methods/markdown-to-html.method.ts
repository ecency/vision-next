import { traverse } from './traverse.method'
import { sanitizeHtml } from './sanitize-html.method'
import { DOMParser, ENTITY_REGEX } from '../consts'
import { XMLSerializer } from '@xmldom/xmldom'
import { Remarkable } from 'remarkable'
import { linkify } from 'remarkable/linkify'
import he from 'he'
import * as htmlparser2 from 'htmlparser2'
import * as domSerializerModule from 'dom-serializer'

const domSerializer = (domSerializerModule as any).default || domSerializerModule

// Lazy-load lolight to avoid dynamic require issues in browser builds
let lolight: any = null
function getLolightInstance() {
  if (!lolight) {
    try {
      lolight = require('lolight')
    } catch (e) {
      // Lolight not available (browser build) - use fallback
      return null
    }
  }
  return lolight
}

/**
 * Fixes block-level HTML tags that Remarkable incorrectly wraps inside <p> tags.
 *
 * Problem: When Remarkable encounters block-level HTML tags (like <center>, <div>)
 * with blank lines after them, it generates malformed HTML like:
 *   <p><center></p>
 *   <p>content</p>
 *   <p></center></p>
 *
 * This function repairs such patterns by:
 * 1. Extracting block-level tags from paragraph wrappers
 * 2. Removing empty paragraphs created by this mismatch
 *
 * @param html - The HTML string to fix
 * @returns The repaired HTML string
 */
function fixBlockLevelTagsInParagraphs(html: string): string {
  // Block-level tags that should never be wrapped in <p> tags
  const blockTags = 'center|div|table|figure|section|article|aside|header|footer|nav|main'

  // Pattern 1: <p><tag></p> - opening tag wrapped in <p>
  // Replace with just <tag> (remove the wrapping <p>)
  const openingPattern = new RegExp(`<p>(<(?:${blockTags})(?:\\s[^>]*)?>)<\\/p>`, 'gi')
  html = html.replace(openingPattern, '$1')

  // Pattern 2: <p></tag></p> - closing tag wrapped in <p>
  // Replace with just </tag> (remove the wrapping <p>)
  const closingPattern = new RegExp(`<p>(<\\/(?:${blockTags})>)<\\/p>`, 'gi')
  html = html.replace(closingPattern, '$1')

  // Pattern 3: <p><tag><br> or <p><tag> at start of <p>
  // This handles cases where the tag is at the start but followed by content
  const startPattern = new RegExp(`<p>(<(?:${blockTags})(?:\\s[^>]*)?>)(?:<br>)?\\s*`, 'gi')
  html = html.replace(startPattern, '$1<p>')

  // Pattern 4: </tag></p> or <br>\n</tag></p> - closing tag at end of <p>
  const endPattern = new RegExp(`\\s*(?:<br>)?\\s*(<\\/(?:${blockTags})>)<\\/p>`, 'gi')
  html = html.replace(endPattern, '</p>$1')

  // Clean up any empty paragraphs that may have been created
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/<p><br>\s*<\/p>/g, '')

  return html
}

export function markdownToHTML(input: string, forApp: boolean, webp: boolean, parentDomain: string = 'ecency.com'): string {
  // Internalize leofinance.io links
  input = input.replace(new RegExp("https://leofinance.io/threads/view/","g"), "/@");
  input = input.replace(new RegExp("https://leofinance.io/posts/","g"), "/@");
  input = input.replace(new RegExp("https://leofinance.io/threads/","g"), "/@");
  input = input.replace(new RegExp("https://inleo.io/threads/view/","g"), "/@");
  input = input.replace(new RegExp("https://inleo.io/posts/","g"), "/@");
  input = input.replace(new RegExp("https://inleo.io/threads/","g"), "/@");


  const md = new Remarkable({
    html: true,
    breaks: true,
    typographer: false,
    highlight: function (str: string) {
      const lolightInstance = getLolightInstance()
      if (!lolightInstance) {
        // Fallback when lolight is not available
        return str
      }

      try {
        const tokens = lolightInstance.tok(str);
        return tokens.map(
          (token: string[]) => `<span class="ll-${token[0]}">${token[1]}</span>`
        ).join('')
      } catch (err) { console.error(err) }

      return str
    }
  }).use(linkify)
  md.core.ruler.enable([
    'abbr'
  ]);
  md.block.ruler.enable([
    'footnote',
    'deflist'
  ]);
  md.inline.ruler.enable([
    'footnote_inline',
    'ins',
    'mark',
    'sub',
    'sup'
  ]);
  const serializer = new XMLSerializer()

  if (!input) {
    return ''
  }

  let output = '';

  // Replace entities with deterministic placeholders to preserve them during rendering
  const entities = input.match(ENTITY_REGEX);
  const entityPlaceholders: string[] = [];

  if (entities && forApp) {
    // Deduplicate entities to avoid duplicate placeholders
    const uniqueEntities = [...new Set(entities)];
    uniqueEntities.forEach((entity, index) => {
      // Use markdown-inert Unicode placeholder (zero-width spaces)
      const placeholder = `\u200B${index}\u200B`;
      entityPlaceholders.push(entity);
      // Replace all occurrences of this entity
      input = input.split(entity).join(placeholder);
    })
  }


  try {
    output = md.render(input)

    // Fix malformed block-level HTML tags that Remarkable wraps in <p> tags
    // This prevents "Opening and ending tag mismatch" errors from DOMParser
    output = fixBlockLevelTagsInParagraphs(output)

    const doc = DOMParser.parseFromString(`<body id="root">${output}</body>`, 'text/html')

    traverse(doc, forApp, 0, webp, { firstImageFound: false }, parentDomain)

    output = serializer.serializeToString(doc)
  } catch (error) {
    // @xmldom/xmldom is stricter than old xmldom and throws ParseError for malformed HTML
    // Instead of returning empty string (bad UX), attempt graceful recovery
    try {
      // Strategy:
      // 1. Pre-sanitize to remove XSS vectors
      // 2. Use lenient htmlparser2 to auto-repair malformed HTML (auto-close unclosed tags)
      // 3. Serialize the repaired HTML
      // 4. Re-parse with @xmldom/xmldom (now well-formed)
      // 5. Traverse and serialize as normal
      output = md.render(input)
      const preSanitized = sanitizeHtml(output)

      // Use htmlparser2 to parse malformed HTML leniently
      const dom = htmlparser2.parseDocument(preSanitized, {
        // lenient options - don't throw on malformed HTML
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
      })

      // Serialize back to well-formed HTML (htmlparser2 auto-closes tags)
      const repairedHtml = domSerializer(dom.children)

      // Now parse the well-formed HTML with @xmldom/xmldom
      const doc = DOMParser.parseFromString(`<body id="root">${repairedHtml}</body>`, 'text/html')

      traverse(doc, forApp, 0, webp, { firstImageFound: false }, parentDomain)

      output = serializer.serializeToString(doc)
    } catch (fallbackError) {
      // If repair + re-parsing fails, HTML-escape to preserve content visibility
      // This prevents XSS while still showing users what they wrote
      const escapedContent = he.encode(output || md.render(input))
      output = `<p dir="auto">${escapedContent}</p>`
    }
  }

  // Restore original entities from placeholders
  if (forApp && output && entityPlaceholders.length > 0) {
    entityPlaceholders.forEach((entity, index) => {
      const placeholder = `\u200B${index}\u200B`;
      // Replace all occurrences of the placeholder
      output = output.split(placeholder).join(entity);
    })
  }

  output = output.replace(/ xmlns="http:\/\/www.w3.org\/1999\/xhtml"/g, '')
    .replace('<body id="root">', '')
    .replace('</body>', '')
    .trim()

  return sanitizeHtml(output)
}
