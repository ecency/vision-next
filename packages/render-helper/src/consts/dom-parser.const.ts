import { DOMParser as XMLDOMParser } from '@xmldom/xmldom'

// Lenient error handler that suppresses all parse errors without stopping
// This allows @xmldom/xmldom to continue parsing malformed HTML instead of throwing ParseError
// The parser will do its best to construct a valid DOM tree even with mismatched/unclosed tags
// This maintains compatibility with the old xmldom behavior and provides better UX for users
// who accidentally write malformed HTML (e.g., forgot to close a tag)
const lenientErrorHandler = (level: 'warning' | 'error' | 'fatalError', msg: string) => {
  // Don't throw - just log in development if needed
  // By not throwing, we allow the parser to recover and continue
  // Unlike onErrorStopParsing/onWarningStopParsing defaults, this allows parsing to continue
  if (process.env.NODE_ENV === 'development' && level === 'fatalError') {
    console.warn('[DOMParser]', level, msg)
  }
}

export const DOMParser = new XMLDOMParser({
  // Use onError instead of deprecated errorHandler
  // By providing a non-throwing error handler, parsing continues despite malformed HTML
  onError: lenientErrorHandler,
})
