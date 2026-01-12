import { DOMParser } from './consts'

export function createDoc(html: string): Document | null {
  if (html.trim() === '') {
    return null
  }

  const doc = DOMParser.parseFromString(html, 'text/html')

  return doc
}

export function makeEntryCacheKey(entry: any): string {
  return `${entry.author}-${entry.permlink}-${entry.last_update}-${entry.updated}`
}

export function extractYtStartTime(url:string):string {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    if(params.has('t')){
      const t = params.get('t');
      return '' + parseInt(t || '0'); //parsing is important as sometimes t is famated '123s';
    }else if (params.has('start')){
      return params.get('start') || '';
    }
    return '';
  } catch (error) {
    return '';
  }
}
export function sanitizePermlink(permlink: string): string {
  if (!permlink || typeof permlink !== 'string') {
    return ''
  }

  const [withoutQuery] = permlink.split('?')
  const [cleaned] = withoutQuery.split('#')

  return cleaned
}

export function isValidPermlink(permlink: string): boolean {
  const sanitized = sanitizePermlink(permlink)

  if (!sanitized) {
    return false
  }

  // Should not contain image extensions, query params, or fragments
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(sanitized)
  const isCleanFormat = /^[a-z0-9-]+$/.test(sanitized) // Hive standard

  return isCleanFormat && !isImage
}

// Reference: https://en.wikipedia.org/wiki/Domain_Name_System#Domain_name_syntax
// Hive account names must follow similar rules to DNS (RFC 1035)
const LABEL_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  if (username.length > 16) return false;

  const labels = username.split('.');

  return labels.every(label => {
    return (
      label.length >= 3 &&
      label.length <= 16 &&
      /^[a-z]/.test(label) &&                    // must start with a letter
      LABEL_REGEX.test(label) &&                 // a-z0-9, hyphens, no start/end hyphen
      !label.includes('..')                      // double dots are impossible after split, but just in case
    );
  });
}



