import { DOMParser as XMLDOMParser } from '@xmldom/xmldom'

// Use native browser DOMParser when available, fall back to xmldom for Node.js
const isBrowser = typeof globalThis.DOMParser !== 'undefined'

// Lenient error handler for xmldom - suppresses parse errors for malformed user content
const lenientErrorHandler = (level: 'warning' | 'error' | 'fatalError', msg: string, _context: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DOMParser]', level, msg)
  }
  return undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DOMParser: any = isBrowser
  ? new globalThis.DOMParser()
  : new XMLDOMParser({ onError: lenientErrorHandler })

import { XMLSerializer as XMLDOMSerializer } from '@xmldom/xmldom'

export const XMLSerializer = isBrowser ? globalThis.XMLSerializer : XMLDOMSerializer
