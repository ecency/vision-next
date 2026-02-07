import { DOMParser as XMLDOMParser } from '@xmldom/xmldom'

// Lenient error handler that suppresses all parse errors without stopping
// This allows @xmldom/xmldom to continue parsing malformed HTML instead of throwing ParseError
// The parser will do its best to construct a valid DOM tree even with mismatched/unclosed tags
// This maintains compatibility with the old xmldom behavior and provides better UX for users
// who accidentally write malformed HTML (e.g., forgot to close a tag)
//
// In @xmldom/xmldom 0.9+, more issues are reported as fatalError (including duplicate attributes).
// We intentionally suppress these to handle user-generated content that may be malformed.
const lenientErrorHandler = (level: 'warning' | 'error' | 'fatalError', msg: string, context: unknown) => {
  // Don't throw - just log warnings in development for debugging
  // By not throwing, we allow the parser to recover and continue
  // The context parameter is required by the API but we don't use it
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DOMParser]', level, msg)
  }
  // Explicitly return undefined to signal we handled it and parsing should continue
  return undefined
}

export const DOMParser = new XMLDOMParser({
  // Use onError instead of deprecated errorHandler
  // By providing a non-throwing error handler, parsing continues despite malformed HTML
  onError: lenientErrorHandler,
})
