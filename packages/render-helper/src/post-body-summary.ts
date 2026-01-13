import he from 'he'
import { makeEntryCacheKey } from './helper'
import { cacheGet, cacheSet } from './cache'
import { Entry } from './types'
import { cleanReply } from './methods'
import { ENTITY_REGEX } from './consts'


const { Remarkable } = require('remarkable')
const { linkify } = require('remarkable/linkify')

const joint = (arr: string[], limit = 200) => {
  let result = '';
  if (arr) {
    for (let i = 0; i < arr.length; i++) {
      // join array with space separator
      if (result) {
        result += " ";
      }
      // break with length reaches limit
      if (result.length > limit) {
        break;
      } else {
        // make sure last join doesn't break the limit too much
        if ((result + arr[i]).length < limit + 10) {
          result += arr[i];
        } else {
          break;
        }
      }
    }
  }
  return result.trim();
};

/**
 * Generate a text summary from post body content
 * @param entryBody - The post body content to summarize
 * @param length - Maximum length of the summary (default: 200)
 * @param platform - Target platform: 'web' for browser/Node.js, 'ios'/'android' for React Native (default: 'web')
 *                   Controls entity/placeholder handling - 'web' skips placeholder substitution, other values enable it
 */
function postBodySummary(entryBody: string, length?: number, platform:'ios'|'android'|'web' = 'web'): string {
  if (!entryBody) {
    return ''
  }
  entryBody = cleanReply(entryBody)

  const mdd = new Remarkable({
    html: true,
    breaks: true,
    typographer: false,
  }).use(linkify)
  mdd.core.ruler.enable([
    'abbr'
  ]);
  mdd.block.ruler.enable([
    'footnote',
    'deflist'
  ]);
  mdd.inline.ruler.enable([
    'footnote_inline',
    'ins',
    'mark',
    'sub',
    'sup'
  ]);

  // Replace entities with deterministic placeholders to preserve them during rendering
  const entities = entryBody.match(ENTITY_REGEX);
  const entityPlaceholders: string[] = [];
  if (entities && platform !== 'web') {
    // Deduplicate entities to avoid duplicate placeholders
    const uniqueEntities = [...new Set(entities)];
    uniqueEntities.forEach((entity, index) => {
      // Use deterministic unique placeholder
      const placeholder = `__ENTITY_${index}__`;
      entityPlaceholders.push(entity);
      // Replace all occurrences of this entity
      entryBody = entryBody.split(entity).join(placeholder);
    })
  }

  // Convert markdown to html
  let text = '';
  try {
    text = mdd.render(entryBody)
  } catch (err) {
    // Log error with context for debugging
    console.error('[postBodySummary] Failed to render markdown:', {
      error: err instanceof Error ? err.message : String(err),
      entryBodyLength: entryBody?.length || 0,
      platform
    })
    // Set empty text on error - caller receives empty summary
    text = ''
  }


  // Restore original entities from placeholders
  if (platform !== 'web' && entityPlaceholders.length > 0) {
    entityPlaceholders.forEach((entity, index) => {
      const placeholder = `__ENTITY_${index}__`;
      // Replace all occurrences of the placeholder
      text = text.split(placeholder).join(entity);
    })
  }


  text = text
    .replace(/(<([^>]+)>)/gi, '') // Remove html tags
    .replace(/\r?\n|\r/g, ' ') // Remove new lines
    .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') // Remove urls
    .trim()
    .replace(/ +(?= )/g, '') // Remove all multiple spaces

  if (length) {
    // Truncate
    text = joint(text.split(' '), length)
  }

  if (text) {
    text = he.decode(text) // decode html entities  
  }

  return text
}

/**
 * Generate a text summary from an Entry object or raw string
 * @param obj - Entry object or raw post body string
 * @param length - Maximum length of the summary (default: 200)
 * @param platform - Target platform: 'web' for browser/Node.js, 'ios'/'android' for React Native (default: 'web')
 *                   Determines which crypto implementation to use ('web' = standard, other = react-native-crypto-js)
 * @returns Text summary of the post body
 */
export function getPostBodySummary(obj: Entry | string, length?: number, platform?:'ios'|'android'|'web'): string {
  if (typeof obj === 'string') {
    return postBodySummary(obj as string, length, platform)
  }

  const key = `${makeEntryCacheKey(obj)}-sum-${length}-${platform || 'web'}`

  const item = cacheGet<string>(key)
  if (item) {
    return item
  }

  const res = postBodySummary(obj.body, length, platform)
  cacheSet(key, res)

  return res
}
