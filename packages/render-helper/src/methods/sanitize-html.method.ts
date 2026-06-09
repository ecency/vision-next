import xss from 'xss'
import {ALLOWED_ATTRIBUTES, ID_WHITELIST} from '../consts'
import { getProxyBase } from '../proxify-image-src'
import { trimTrailingSlash } from '../helper'

const decodeEntities = (input: string): string =>
  input
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));

// A <source> in a <picture> may only point at the image proxy's /p/ route. This
// blocks a malicious on-chain <source srcset="..."> from beaconing to an
// external host or using a non-http scheme (the <img> src/srcset already get
// the http(s) check below). Our renderer only ever emits proxyBase /p/ srcsets.
const isProxyPSrcset = (srcset: string): boolean => {
  const base = trimTrailingSlash(getProxyBase());
  const candidates = srcset.split(',').map(c => c.trim().split(/\s+/)[0]).filter(Boolean);
  return candidates.length > 0 && candidates.every(url => url.startsWith(`${base}/p/`));
};

export function sanitizeHtml(html: string): string {
  const cleaned = xss(html, {
    whiteList: ALLOWED_ATTRIBUTES,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['style'],
    css: false, // block style attrs entirely for safety
    onTagAttr: (tag, name, value) => {
      const decoded = decodeEntities(value.trim());
      const decodedLower = decoded.toLowerCase();

      if (name.startsWith('on')) return ''; // 🛡 event handlers
      // Positive-whitelist: only http(s) is accepted. Any other scheme
      // (javascript:, data:, vbscript:, file:, etc.) is rejected by the
      // negation. We don't need an explicit blocklist alongside.
      if (tag === 'img' && name === 'src' && !/^https?:\/\//.test(decodedLower)) return '';
      // Validate srcset: reject if any candidate URL uses a non-http(s) protocol
      if (tag === 'img' && name === 'srcset') {
        const candidates = decoded.split(',').map(c => c.trim().split(/\s+/)[0]);
        if (candidates.some(url => !/^https?:\/\//i.test(url))) return '';
      }
      // <picture><source>: srcset is restricted to the proxy /p/ route, and type
      // to the two formats we emit. Anything else is blanked (and a then
      // type-less <source> is dropped wholesale in the post-pass below).
      if (tag === 'source' && name === 'srcset' && !isProxyPSrcset(decoded)) return '';
      if (tag === 'source' && name === 'type' && decodedLower !== 'image/avif' && decodedLower !== 'image/webp') return '';
      if (
        tag === 'video' && ['src', 'poster'].includes(name) &&
        !/^https?:\/\//.test(decodedLower)
      ) return '';
      if (tag === 'img' && ['dynsrc', 'lowsrc'].includes(name)) return '';
      if (tag === 'span' && name === 'class' && decoded.toLowerCase().trim() === 'wr') return '';
      if (name === 'id') {
        if (!ID_WHITELIST.test(decoded)) return '';
      }
      return undefined;
    }
  });

  // Drop any <source> that lacks a valid avif/webp type. onTagAttr can blank an
  // attribute but can't remove an element, and a type-less <source> with a
  // surviving srcset would match ALL browsers (overriding the <img>). Our
  // renderer always emits a typed <source>, so this only fires on hostile input.
  return cleaned.replace(/<source\b[^>]*>/gi, (t) =>
    /\btype\s*=\s*["'](?:image\/avif|image\/webp)["']/i.test(t) ? t : ''
  );
}
