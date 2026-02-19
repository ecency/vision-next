import { IMG_REGEX, SECTION_LIST } from '../consts'
import { proxifyImageSrc } from '../proxify-image-src'
import { isValidPermlink, isValidUsername, sanitizePermlink } from "../helper";
import { createImageHTML } from "./img.method";

export function linkify(content: string, forApp: boolean): string {
  // Tags
  content = content.replace(/(^|\s|>)(#[-a-z\d]+)/gi, tag => {
    if (/#[\d]+$/.test(tag)) return tag // do not allow only numbers (like #1)
    const preceding = /^\s|>/.test(tag) ? tag[0] : '' // space or closing tag (>)
    tag = tag.replace('>', '') // remove closing tag
    const tag2 = tag.trim().substring(1)
    const tagLower = tag2.toLowerCase()

    const attrs = forApp ? `data-tag="${tagLower}"` : `href="/trending/${tagLower}"`
    return `${preceding}<a class="markdown-tag-link" ${attrs}>${tag.trim()}</a>`
  })

  // User mentions
  content = content.replace(
    /(^|[^a-zA-Z0-9_!#$%&*@＠/]|(^|[^a-zA-Z0-9_+~.-/]))[@＠]([a-z][-.a-z\d^/]+[a-z\d])/gi,
    (match, preceeding1, preceeding2, user) => {
      const userLower = user.toLowerCase()
      const preceedings = (preceeding1 || '') + (preceeding2 || '')
      if (userLower.indexOf('/') === -1 && isValidUsername(user)) {
        const attrs = forApp ? `data-author="${userLower}"` : `href="/@${userLower}"`
        return `${preceedings}<a class="markdown-author-link" ${attrs}>@${user}</a>`
      } else {
        return match
      }
    }
  )

  // internal links
  content = content.replace(
    /((^|\s)(\/|)@[\w.\d-]+)\/(\S+)/gi, (match, u, p1, p2, p3) => {
      const uu = u.trim().toLowerCase().replace('/@', '').replace('@', '');
      const permlink = sanitizePermlink(p3);
      if (!isValidPermlink(permlink)) return match;

      if (SECTION_LIST.some(v => p3.includes(v))) {
        const attrs = forApp ? `href="https://ecency.com/@${uu}/${permlink}"` : `href="/@${uu}/${permlink}"`
        return ` <a class="markdown-profile-link" ${attrs}>@${uu}/${permlink}</a>`
      } else {
        const attrs = forApp ? `data-author="${uu}" data-tag="post" data-permlink="${permlink}"` : `href="/post/@${uu}/${permlink}"`
        return ` <a class="markdown-post-link" ${attrs}>@${uu}/${permlink}</a>`
      }
    }
  )

  // Image links
  let firstImageUsed = false;

  content = content.replace(IMG_REGEX, (imglink) => {
    const isLCP = !firstImageUsed;
    firstImageUsed = true;
    return createImageHTML(imglink, isLCP);
  });

  return content
}
