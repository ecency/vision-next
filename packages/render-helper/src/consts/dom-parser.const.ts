import { DOMParser as XMLDOMParser, XMLSerializer as XMLDOMSerializer } from '@xmldom/xmldom'

// Lenient error handler for xmldom - suppresses ALL parse errors without throwing.
// This is critical: xmldom 0.9+ throws on fatalError by default, which causes the
// render pipeline to fall through to the HTML-escaping fallback, showing raw tags.
function createParser() {
  return new XMLDOMParser({
    onError(level: string, msg: string) {
      void level
      void msg
    },
  })
}

export const DOMParser = createParser()

export { XMLDOMSerializer as XMLSerializer }
