import multihash from 'multihashes'
import querystring from 'querystring'

let proxyBase = 'https://images.ecency.com'

export function setProxyBase(p: string): void {
  proxyBase = p
}

export function extractPHash(url: string): string | null {
  if (url.startsWith(`${proxyBase}/p/`)) {
    const [hash] = url.split('/p/')[1].split('?')
    return hash.replace(/\.(webp|png)$/,'')
  }
  return null
}

export function isValidUrl(url: string): boolean {
  try {
    return Boolean(new URL(url));
  }
  catch(e){
    return false;
  }
}

export function getLatestUrl(str: string): string {
  const [last] = [...str.replace(/https?:\/\//g, '\n$&').trim().split('\n')].reverse()
  return last
}

/**
 * @param _format - @deprecated Ignored. Always uses 'match' — format is handled server-side via Accept header.
 */
export function proxifyImageSrc(url?: string, width = 0, height = 0, _format = 'match') {
  if (!url || typeof url !== 'string' || !isValidUrl(url)) {
    return ''
  }

  // skip images already proxified with images.hive.blog
  if (url.indexOf('https://images.hive.blog/') === 0 && url.indexOf('https://images.hive.blog/D') !== 0) {
    return url.replace('https://images.hive.blog', proxyBase)
  }

  if (url.indexOf('https://steemitimages.com/') === 0 && url.indexOf('https://steemitimages.com/D') !== 0) {
    return url.replace('https://steemitimages.com', proxyBase)
  }

  const realUrl = getLatestUrl(url)
  const pHash = extractPHash(realUrl)

  // Always use 'match' format — the server handles WebP via Accept header content negotiation
  const options: Record<string, string | number> = {
    format: 'match',
    mode: 'fit',
  }

  if (width > 0) {
    options.width = width
  }

  if (height > 0) {
    options.height = height
  }

  const qs = querystring.stringify(options)

  if (pHash) {
    return `${proxyBase}/p/${pHash}?${qs}`
  }

  const b58url = multihash.toB58String(Buffer.from(realUrl.toString()))

  return `${proxyBase}/p/${b58url}?${qs}`
}
