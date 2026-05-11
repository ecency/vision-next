import { makeEntryCacheKey } from './helper'
import { cleanReply, markdownToHTML } from './methods'
import { cacheGet, cacheSet } from './cache'
import { Entry, RenderOptions, SeoContext } from './types'

// Warn when a single markdown render exceeds this threshold. Surfaces both
// pathological inputs (e.g. ReDoS-prone tag attributes) and merely-slow ones
// (huge bodies hitting the xmldom fallback) so they can be triaged from logs
// without waiting for the SSR watchdog to kill a container.
//
// Configurable via `setSlowRenderThresholdMs(ms)`. Set to 0 to disable.
let slowRenderThresholdMs = 500

export function setSlowRenderThresholdMs(ms: number): void {
  slowRenderThresholdMs = Math.max(0, ms)
}

function logIfSlow(durationMs: number, context: string): void {
  if (slowRenderThresholdMs > 0 && durationMs >= slowRenderThresholdMs) {
    // console.warn is safe in both Node and browser; the message format is
    // grep-friendly: "[render-helper] slow markdown render" is a single
    // unique prefix that doesn't collide with anything else in the codebase.
    // eslint-disable-next-line no-console
    console.warn(
      `[render-helper] slow markdown render: ${durationMs.toFixed(0)}ms ${context}`
    )
  }
}

/**
 * @param obj - Entry object or raw markdown string
 * @param forApp - Whether rendering for app context
 * @param _webp - @deprecated Ignored. Format is now handled server-side via Accept header content negotiation.
 * @param parentDomain - Parent domain for iframe embed parameters
 * @param seoContext - Optional SEO context for structured data
 * @param renderOptions - Optional rendering options (e.g. embedVideosDirectly)
 */
export function markdown2Html(obj: Entry | string, forApp = true, _webp = false, parentDomain: string = 'ecency.com', seoContext?: SeoContext, renderOptions?: RenderOptions): string {
  if (typeof obj === 'string') {
    const cleanedStr = cleanReply(obj)
    const t0 = performance.now()
    const res = markdownToHTML(cleanedStr, forApp, parentDomain, seoContext, renderOptions)
    logIfSlow(
      performance.now() - t0,
      `body_len=${obj.length} preview=${JSON.stringify(obj.slice(0, 60))}`
    )
    return res
  }

  const key = `${makeEntryCacheKey(obj)}-md-${forApp ? 'app' : 'site'}-${parentDomain}${seoContext ? `-seo${seoContext.authorReputation ?? ''}-${seoContext.postPayout ?? ''}` : ''}${renderOptions?.embedVideosDirectly ? '-embed' : ''}`

  const item = cacheGet<string>(key)
  if (item) {
    return item
  }

  const cleanBody = cleanReply(obj.body)

  const t0 = performance.now()
  const res = markdownToHTML(cleanBody, forApp, parentDomain, seoContext, renderOptions)
  logIfSlow(
    performance.now() - t0,
    `author=@${obj.author} permlink=${obj.permlink} body_len=${obj.body?.length ?? 0}`
  )
  cacheSet(key, res)

  return res
}
