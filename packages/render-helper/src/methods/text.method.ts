import { IMG_REGEX, YOUTUBE_REGEX, WHITE_LIST, DOMParser, POST_REGEX  } from '../consts'
import { extractYtStartTime, isValidPermlink, isValidUsername, sanitizePermlink } from '../helper'
import { proxifyImageSrc } from '../proxify-image-src'
import { linkify } from './linkify.method'
import {createImageHTML} from "./img.method";

export function text(node: HTMLElement | null, forApp: boolean, webp: boolean): void {
  if (!node || !node.parentNode) {
    return
  }

  if (['a', 'code'].includes(node.parentNode.nodeName)) {
    return
  }

  const nodeValue = node.nodeValue || ''
  const linkified = linkify(nodeValue, forApp, webp)
  if (linkified !== nodeValue) {
    const replaceNode = DOMParser.parseFromString(
      `<span class="wr">${linkified}</span>`
    )

    node.parentNode.insertBefore(replaceNode, node)
    node.parentNode.removeChild(node)
    return
  }

  if (nodeValue.match(IMG_REGEX)) {
    const isLCP = false; // Traverse handles LCP; no need to double-count
    const imageHTML = createImageHTML(nodeValue, isLCP, webp);
    const replaceNode = DOMParser.parseFromString(imageHTML);
    node.parentNode.replaceChild(replaceNode, node);
  }
  // If a youtube video
  if (nodeValue.match(YOUTUBE_REGEX)) {
    const e = YOUTUBE_REGEX.exec(nodeValue)
    if (e[1]) {
      const vid = e[1]
      const thumbnail = proxifyImageSrc(`https://img.youtube.com/vi/${vid.split('?')[0]}/hqdefault.jpg`, 0, 0, webp ? 'webp' : 'match')
      const embedSrc = `https://www.youtube.com/embed/${vid}?autoplay=1`

      let attrs = `class="markdown-video-link markdown-video-link-youtube" data-embed-src="${embedSrc}" data-youtube="${vid}"`
      //extract start time if available
      const startTime = extractYtStartTime(nodeValue);
      if(startTime){
        attrs = attrs.concat(` data-start-time="${startTime}"`);
      }

      const thumbImg = node.ownerDocument.createElement('img')
      thumbImg.setAttribute('class', 'no-replace video-thumbnail')
      thumbImg.setAttribute('src', thumbnail)

      const play = node.ownerDocument.createElement('span')
      play.setAttribute('class', 'markdown-video-play')

      const replaceNode = DOMParser.parseFromString(`<p><a ${attrs}>${thumbImg}${play}</a></p>`)
      node.parentNode.replaceChild(replaceNode, node)
    }
  }
  if (nodeValue && typeof nodeValue === 'string') {
    const postMatch = nodeValue.trim().match(POST_REGEX)
    if (postMatch && WHITE_LIST.includes(postMatch[1].replace(/www./,''))) {
      const tag = postMatch[2]
      const author = postMatch[3].replace('@', '')
      const permlink = sanitizePermlink(postMatch[4])

      if (!isValidUsername(author)) return
      if (!isValidPermlink(permlink)) return

      const attrs = forApp ? `data-tag="${tag}" data-author="${author}" data-permlink="${permlink}" class="markdown-post-link"` : `class="markdown-post-link" href="/${tag}/@${author}/${permlink}"`
      const replaceNode = DOMParser.parseFromString(
        `<a ${attrs}>/@${author}/${permlink}</a>`
      )
      node.parentNode.replaceChild(replaceNode, node)
    }
  }
}
