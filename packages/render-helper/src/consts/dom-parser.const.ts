import { DOMParser as XMLDOMParser, XMLSerializer as XMLDOMSerializer } from '@xmldom/xmldom'

const hasDOMParser = typeof globalThis.DOMParser !== 'undefined'
const hasXMLSerializer = typeof globalThis.XMLSerializer !== 'undefined'

// Lenient error handler for xmldom - suppresses parse errors for malformed user content
const lenientErrorHandler = (level: 'warning' | 'error' | 'fatalError', msg: string, _context: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DOMParser]', level, msg)
  }
  return undefined
}

// In browsers, use native DOMParser/XMLSerializer. In Node.js, use xmldom.
// Both APIs are compatible for the parseFromString/serializeToString usage in this package.
export const DOMParser = hasDOMParser
  ? new globalThis.DOMParser() as unknown as InstanceType<typeof XMLDOMParser>
  : new XMLDOMParser({ onError: lenientErrorHandler })

export const XMLSerializer = (hasXMLSerializer
  ? globalThis.XMLSerializer
  : XMLDOMSerializer) as unknown as typeof XMLDOMSerializer
