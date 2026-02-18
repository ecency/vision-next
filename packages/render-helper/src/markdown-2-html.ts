import { makeEntryCacheKey } from './helper'
import { cleanReply, markdownToHTML } from './methods'
import { cacheGet, cacheSet } from './cache'
import { Entry, SeoContext } from './types'

export function markdown2Html(obj: Entry | string, forApp = true, webp = false, parentDomain: string = 'ecency.com', seoContext?: SeoContext): string {
  if (typeof obj === 'string') {
    const cleanedStr = cleanReply(obj)
    return markdownToHTML(cleanedStr, forApp, webp, parentDomain, seoContext)
  }

  const key = `${makeEntryCacheKey(obj)}-md-${forApp ? 'app' : 'site'}-${parentDomain}${seoContext ? `-seo${seoContext.authorReputation ?? ''}-${seoContext.postPayout ?? ''}` : ''}`

  const item = cacheGet<string>(key)
  if (item) {
    return item
  }

  const cleanBody = cleanReply(obj.body)

  const res = markdownToHTML(cleanBody, forApp, webp, parentDomain, seoContext)
  cacheSet(key, res)

  return res
}
