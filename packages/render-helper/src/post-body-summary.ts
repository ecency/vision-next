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
 *                   Determines which crypto implementation to use ('web' = standard, other = react-native-crypto-js)
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

  //encrypt entities
  const entities = entryBody.match(ENTITY_REGEX);
  const encEntities:string[] = [];
  if(entities && platform !== 'web'){
    entities.forEach((entity)=>{
      var CryptoJS = require("react-native-crypto-js");
      const encData = CryptoJS.AES.encrypt(entity, 'key').toString();
      let encyptedEntity = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encData));
      encEntities.push(encyptedEntity);
      entryBody = entryBody.replace(entity, encyptedEntity);
    })
  }

  // Convert markdown to html
  let text = '';
  try {
    text = mdd.render(entryBody)
  } catch (err) {
    console.log(err)
  }


  //decrypt and put back entiteis
  if(platform !== 'web'){
    encEntities.forEach((encEntity)=>{
      var CryptoJS = require("react-native-crypto-js");
      let decData = CryptoJS.enc.Base64.parse(encEntity).toString(CryptoJS.enc.Utf8);
      let entity = CryptoJS.AES.decrypt(decData, 'key').toString(CryptoJS.enc.Utf8);
      text = text.replace(encEntity, entity);
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
export function getPostBodySummary(obj: Entry | string, length?: number, platform?:'ios'|'android'|'web'): any {
  if (typeof obj === 'string') {
    return postBodySummary(obj as string, length, platform)
  }

  const key = `${makeEntryCacheKey(obj)}-sum-${length}`

  const item = cacheGet(key)
  if (item) {
    return item
  }

  const res = postBodySummary(obj.body, length, platform)
  cacheSet(key, res)

  return res
}
