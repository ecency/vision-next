import xss from 'xss'
import {ALLOWED_ATTRIBUTES, ID_WHITELIST} from '../consts'

const decodeEntities = (input: string): string =>
  input
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));

export function sanitizeHtml(html: string): string {
  return xss(html, {
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
}
