import { makeEntryCacheKey } from './helper'
import { cleanReply, markdownToHTML } from './methods'
import { cacheGet, cacheSet } from './cache'
import { Entry } from './types'

export function markdown2Html(obj: Entry | string, forApp = true, webp = false, parentDomain: string = 'ecency.com'): string {
  if (typeof obj === 'string') {
    const cleanedStr = cleanReply(obj)
    return markdownToHTML(cleanedStr, forApp, webp, parentDomain)
  }

  const key = `${makeEntryCacheKey(obj)}-md${webp ? '-webp' : ''}-${forApp ? 'app' : 'site'}-${parentDomain}`

  const item = cacheGet<string>(key)
  if (item) {
    return item
  }

  const cleanBody = cleanReply(obj.body)

  const res = markdownToHTML(cleanBody, forApp, webp, parentDomain)
  cacheSet(key, res)

  return res
}
