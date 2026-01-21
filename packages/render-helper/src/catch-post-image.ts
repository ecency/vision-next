import { proxifyImageSrc } from './proxify-image-src'
import { markdown2Html } from './markdown-2-html'
import { createDoc, makeEntryCacheKey } from './helper'
import { cacheGet, cacheSet } from './cache'
import { Entry } from './types'
import he from 'he'

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
    // Decode HTML entities (e.g., &amp; -> &) before proxifying
    const decodedImage = he.decode(meta.image)
    if (isGifLink(decodedImage)) {
      return proxifyImageSrc(decodedImage, 0, 0, format)
    }
    return proxifyImageSrc(decodedImage, width, height, format)
  }

  if (meta && meta.image && !!meta.image.length && meta.image[0]) {
    // Only decode if it's a string, otherwise pass through to proxifyImageSrc which will return ''
    if (typeof meta.image[0] === 'string') {
      // Decode HTML entities (e.g., &amp; -> &) before proxifying
      const decodedImage = he.decode(meta.image[0])
      if (isGifLink(decodedImage)) {
        return proxifyImageSrc(decodedImage, 0, 0, format)
      }
      return proxifyImageSrc(decodedImage, width, height, format)
    }
    // For non-string types, let proxifyImageSrc handle it (returns '')
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
    // Decode HTML entities (e.g., &amp; -> &) before proxifying
    const decodedSrc = he.decode(src)
    if (isGifLink(decodedSrc)) {
      return proxifyImageSrc(decodedSrc, 0, 0, format)
    }
    return proxifyImageSrc(decodedSrc, width, height, format)
  }

  return null
}

export function catchPostImage(obj: Entry | string, width = 0, height = 0, format = 'match'): string | null {
  if (typeof obj === 'string') {
    // Process string directly to avoid cache key collision
    // Don't create Entry wrapper as it would generate invalid cache keys
    const html = markdown2Html(obj)
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
      // Decode HTML entities (e.g., &amp; -> &) before proxifying
      const decodedSrc = he.decode(src)
      if (isGifLink(decodedSrc)) {
        return proxifyImageSrc(decodedSrc, 0, 0, format)
      }
      return proxifyImageSrc(decodedSrc, width, height, format)
    }

    return null
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

