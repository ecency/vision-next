import { makeEntryCacheKey } from './helper'
import { cleanReply, markdownToHTML } from './methods'
import { cacheGet, cacheSet } from './cache'
import { Entry, RenderOptions, SeoContext } from './types'

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
    return markdownToHTML(cleanedStr, forApp, parentDomain, seoContext, renderOptions)
  }

  const key = `${makeEntryCacheKey(obj)}-md-${forApp ? 'app' : 'site'}-${parentDomain}${seoContext ? `-seo${seoContext.authorReputation ?? ''}-${seoContext.postPayout ?? ''}` : ''}${renderOptions?.embedVideosDirectly ? '-embed' : ''}`

  const item = cacheGet<string>(key)
  if (item) {
    return item
  }

  const cleanBody = cleanReply(obj.body)

  const res = markdownToHTML(cleanBody, forApp, parentDomain, seoContext, renderOptions)
  cacheSet(key, res)

  return res
}
