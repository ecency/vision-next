import { traverse } from './traverse.method'
import { sanitizeHtml } from './sanitize-html.method'
import { DOMParser, ENTITY_REGEX } from '../consts'
import xmldom from 'xmldom'

const lolight = require('lolight')
const { Remarkable } = require('remarkable')
const { linkify } = require('remarkable/linkify')


export function markdownToHTML(input: string, forApp: boolean, webp: boolean): string {
  // Internalize leofinance.io links
  input = input.replace(new RegExp("https://leofinance.io/threads/view/","g"), "/@");
  input = input.replace(new RegExp("https://leofinance.io/posts/","g"), "/@");
  input = input.replace(new RegExp("https://leofinance.io/threads/","g"), "/@");
  input = input.replace(new RegExp("https://inleo.io/threads/view/","g"), "/@");
  input = input.replace(new RegExp("https://inleo.io/posts/","g"), "/@");
  input = input.replace(new RegExp("https://inleo.io/threads/","g"), "/@");


  const md = new Remarkable({
    html: true,
    breaks: true,
    typographer: false,
    highlight: function (str: string) {
      try {
        const tokens = lolight.tok(str);
        return tokens.map(
          (token: string[]) => `<span class="ll-${token[0]}">${token[1]}</span>`
        ).join('')
      } catch (err) { console.error(err) }

      return str
    }
  }).use(linkify)
  md.core.ruler.enable([
    'abbr'
  ]);
  md.block.ruler.enable([
    'footnote',
    'deflist'
  ]);
  md.inline.ruler.enable([
    'footnote_inline',
    'ins',
    'mark',
    'sub',
    'sup'
  ]);
  const XMLSerializer = new xmldom.XMLSerializer()

  if (!input) {
    return ''
  }

  let output = '';

  //encrypt entities
  const entities = input.match(ENTITY_REGEX);
  const encEntities:string[] = [];

  try{
    if(entities && forApp){
      entities.forEach((entity)=>{
        const CryptoJS = require("react-native-crypto-js");
        const encData = CryptoJS.AES.encrypt(entity, 'key').toString();
        const encyptedEntity = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encData));
        encEntities.push(encyptedEntity);
        input = input.replace(entity, encyptedEntity);
      })
    }
  } catch (err){
    console.log("failed to encrypt entities, ignore if not using mobile");
  }


  try {
    output = md.render(input)
    const doc = DOMParser.parseFromString(`<body id="root">${output}</body>`, 'text/html')

    traverse(doc, forApp, 0, webp)

    output = XMLSerializer.serializeToString(doc)
  } catch (error) {
    output = ''
  }

  //decrypt and put back entiteis
  if(forApp && output){
    encEntities.forEach((encEntity)=>{
      const CryptoJS = require("react-native-crypto-js");
      const decData = CryptoJS.enc.Base64.parse(encEntity).toString(CryptoJS.enc.Utf8);
      const entity = CryptoJS.AES.decrypt(decData, 'key').toString(CryptoJS.enc.Utf8);
      output = output.replace(encEntity, entity);
    })
  }

  output = output.replace(/ xmlns="http:\/\/www.w3.org\/1999\/xhtml"/g, '')
    .replace('<body id="root">', '')
    .replace('</body>', '')
    .trim()

  return sanitizeHtml(output)
}
