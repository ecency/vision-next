import { IMG_REGEX, YOUTUBE_REGEX, WHITE_LIST, DOMParser, POST_REGEX  } from '../consts'
import { extractYtStartTime, isValidPermlink, isValidUsername, sanitizePermlink } from '../helper'
import { proxifyImageSrc } from '../proxify-image-src'
import { linkify } from './linkify.method'
import {createImageHTML} from "./img.method";

export function text(node: HTMLElement | null, forApp: boolean, webp: boolean): void {
  if (!node || !node.parentNode) {
    return
  }

  // Case-insensitive check with null safety
  if (node.parentNode && ['a', 'code'].includes(node.parentNode.nodeName.toLowerCase())) {
    return
  }

  const nodeValue = node.nodeValue || ''
  const linkified = linkify(nodeValue, forApp, webp)
  if (linkified !== nodeValue) {
    const doc = DOMParser.parseFromString(
      `<span class="wr">${linkified}</span>`,
      'text/html'
    )
    const replaceNode = doc.documentElement || doc.firstChild

    node.parentNode.insertBefore(replaceNode, node)
    node.parentNode.removeChild(node)
    return
  }

  if (nodeValue.match(IMG_REGEX)) {
    const isLCP = false; // Traverse handles LCP; no need to double-count
    const imageHTML = createImageHTML(nodeValue, isLCP, webp);
    const doc = DOMParser.parseFromString(imageHTML, 'text/html');
    const replaceNode = doc.documentElement || doc.firstChild
    node.parentNode.replaceChild(replaceNode, node);
    return; // Early return after replacing node
  }
  // If a youtube video
  if (nodeValue.match(YOUTUBE_REGEX)) {
    const e = YOUTUBE_REGEX.exec(nodeValue)
    if (e && e[1]) {
      const vid = e[1]
      const thumbnail = proxifyImageSrc(`https://img.youtube.com/vi/${vid.split('?')[0]}/hqdefault.jpg`, 0, 0, webp ? 'webp' : 'match')
      const embedSrc = `https://www.youtube.com/embed/${vid}?autoplay=1`

      let attrs = `class="markdown-video-link markdown-video-link-youtube" data-embed-src="${embedSrc}" data-youtube="${vid}"`
      //extract start time if available
      const startTime = extractYtStartTime(nodeValue);
      if(startTime){
        attrs = attrs.concat(` data-start-time="${startTime}"`);
      }

      // Create container paragraph
      const container = node.ownerDocument.createElement('p')

      // Create anchor element
      const anchor = node.ownerDocument.createElement('a')
      anchor.setAttribute('class', 'markdown-video-link markdown-video-link-youtube')
      anchor.setAttribute('data-embed-src', embedSrc)
      anchor.setAttribute('data-youtube', vid)
      if (startTime) {
        anchor.setAttribute('data-start-time', startTime)
      }

      // Create and append thumbnail image
      const thumbImg = node.ownerDocument.createElement('img')
      thumbImg.setAttribute('class', 'no-replace video-thumbnail')
      thumbImg.setAttribute('src', thumbnail)
      anchor.appendChild(thumbImg)

      // Create and append play button
      const play = node.ownerDocument.createElement('span')
      play.setAttribute('class', 'markdown-video-play')
      anchor.appendChild(play)

      // Assemble and replace
      container.appendChild(anchor)
      node.parentNode.replaceChild(container, node)
      return; // Early return after replacing node
    }
  }
  if (nodeValue && typeof nodeValue === 'string') {
    const postMatch = nodeValue.trim().match(POST_REGEX)
    if (postMatch && WHITE_LIST.includes(postMatch[1].replace(/www./,''))) {
      const tag = postMatch[2]
      const author = postMatch[3].replace('@', '')
      const permlink = sanitizePermlink(postMatch[4])

      // Validate tag to prevent attribute breakout XSS
      // Allow only alphanumeric, hyphens, and underscores
      if (!tag || !/^[a-z0-9_-]+$/i.test(tag)) return
      if (!isValidUsername(author)) return
      if (!isValidPermlink(permlink)) return

      const attrs = forApp ? `data-tag="${tag}" data-author="${author}" data-permlink="${permlink}" class="markdown-post-link"` : `class="markdown-post-link" href="/${tag}/@${author}/${permlink}"`
      const doc = DOMParser.parseFromString(
        `<a ${attrs}>/@${author}/${permlink}</a>`,
        'text/html'
      )
      const replaceNode = doc.documentElement || doc.firstChild
      node.parentNode.replaceChild(replaceNode, node)
    }
  }
}
