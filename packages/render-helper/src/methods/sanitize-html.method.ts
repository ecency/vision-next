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
      if (tag === 'img' && name === 'src' && (!/^https?:\/\//.test(decodedLower) || decodedLower.startsWith('javascript:'))) return '';
      if (
        tag === 'video' && ['src', 'poster'].includes(name) &&
        (!/^https?:\/\//.test(decodedLower) || decodedLower.startsWith('javascript:'))
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
