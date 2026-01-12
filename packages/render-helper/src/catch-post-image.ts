import { proxifyImageSrc } from './proxify-image-src'
import { markdown2Html } from './markdown-2-html'
import { createDoc, makeEntryCacheKey } from './helper'
import { cacheGet, cacheSet } from './cache'
import { Entry } from './types'

const gifLinkRegex = /\.(gif)$/i;

function isGifLink(link: string) {
  return gifLinkRegex.test(link);
}

function getImage(entry: Entry, width = 0, height = 0, format = 'match'): string | null {
  /*
  * Return from json metadata if exists
  * */
  let meta: Entry['json_metadata'] | null

  if (typeof entry.json_metadata === 'object') {
    meta = entry.json_metadata
  } else {
    try {
      meta = JSON.parse(entry.json_metadata as string)
    } catch (e) {
      meta = null
    }
  }

  if (meta && typeof meta.image === 'string' && meta.image.length > 0) {
    if (isGifLink(meta.image)) {
      return proxifyImageSrc(meta.image, 0, 0, format)
    }
    return proxifyImageSrc(meta.image, width, height, format)
  }

  if (meta && meta.image && !!meta.image.length && meta.image[0]) {
    if (isGifLink(meta.image[0])) {
      return proxifyImageSrc(meta.image[0], 0, 0, format)
    }
    return proxifyImageSrc(meta.image[0], width, height, format)
  }

  // try to find first image from post body
  const html = markdown2Html(entry)
  const doc = createDoc(html)
  if (!doc) {
    return null
  }

  const imgEls = doc.getElementsByTagName('img')
  if (imgEls.length >= 1) {
    const src = imgEls[0].getAttribute('src')
    if (!src) {
      return null
    }
    if (isGifLink(src)) {
      return proxifyImageSrc(src, 0, 0, format)
    }
    return proxifyImageSrc(src, width, height, format)
  }

  return null
}

export function catchPostImage(obj: Entry | string, width = 0, height = 0, format = 'match'): string | null {
  if (typeof obj === 'string') {
    // Create minimal Entry-like wrapper for string input
    const entryWrapper: Entry = {
      body: obj,
      json_metadata: '{}',
    } as Entry
    return getImage(entryWrapper, width, height, format)
  }
  const key = `${makeEntryCacheKey(obj)}-${width}x${height}-${format}`

  const item = cacheGet<string | null>(key)
  if (item) {
    return item
  }

  const res = getImage(obj, width, height, format)
  cacheSet(key, res)

  return res
}

