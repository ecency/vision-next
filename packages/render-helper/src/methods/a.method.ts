import {
  BITCHUTE_REGEX,
  CUSTOM_COMMUNITY_REGEX,
  INTERNAL_POST_REGEX,
  INTERNAL_POST_TAG_REGEX,
  D_TUBE_REGEX,
  D_TUBE_REGEX2,
  IMG_REGEX,
  IPFS_REGEX,
  MENTION_REGEX,
  INTERNAL_MENTION_REGEX,
  TOPIC_REGEX,
  INTERNAL_TOPIC_REGEX,
  POST_REGEX,
  CCC_REGEX,
  SPEAK_REGEX,
  TWITCH_REGEX,
  TWITTER_REGEX,
  VIMEO_REGEX,
  WHITE_LIST,
  YOUTUBE_REGEX,
  SPOTIFY_REGEX,
  RUMBLE_REGEX,
  BRIGHTEON_REGEX,
  DOMParser,
  LOOM_REGEX,
  SECTION_REGEX,
  SECTION_LIST
} from '../consts'
import { getSerializedInnerHTML } from './get-inner-html.method'
import { proxifyImageSrc } from '../proxify-image-src'
import { removeChildNodes } from './remove-child-nodes.method'
import { extractYtStartTime, isValidPermlink, isValidUsername, sanitizePermlink } from '../helper'
import { createImageHTML } from "./img.method";

const normalizeValue = (value?: string | null): string => (value ? value.trim() : '')

const matchesHref = (href: string, value?: string | null): boolean => {
  const normalizedHref = normalizeValue(href)
  if (!normalizedHref) {
    return false
  }

  return normalizeValue(value) === normalizedHref
}

const getInlineMeta = (el: HTMLElement, href: string) => {
  const textMatches = matchesHref(href, el.textContent)
  const titleMatches = matchesHref(href, el.getAttribute('title'))

  return {
    textMatches,
    nonInline: textMatches || titleMatches
  }
}


export function a(el: HTMLElement | null, forApp: boolean, webp: boolean): void {
  if (!el || !el.parentNode) {
    return
  }
  let href = el.getAttribute('href')

  // Continue if href has no value
  if (!href) {
    return
  }

  const className = el.getAttribute('class')

  // Don't touch user and hashtag links
  if (['markdown-author-link', 'markdown-tag-link'].indexOf(className) !== -1) {
    return
  }

  // Do not allow js hrefs (case-insensitive, with colon)
  if (href && href.trim().toLowerCase().startsWith('javascript:')) {
    el.removeAttribute('href')
    return
  }

  // if href is an image url and innerHTML same with href then mark it as image
  // & => &amp; can break equality
  if (
    href.match(IMG_REGEX) &&
    href.trim().replace(/&amp;/g, '&') ===
    getSerializedInnerHTML(el).trim().replace(/&amp;/g, '&')
  ) {
    const isLCP = false; // LCP handled elsewhere
    const imgHTML = createImageHTML(href, isLCP, webp);
    const doc = DOMParser.parseFromString(imgHTML, 'text/html');
    const replaceNode = doc.documentElement || doc.firstChild

    el.parentNode.replaceChild(replaceNode, el)

    return
  }

  if (
    href.match(IPFS_REGEX) &&
    href.trim().replace(/&amp;/g, '&') ===
    getSerializedInnerHTML(el).trim().replace(/&amp;/g, '&') &&
    href.indexOf('#') === -1
  ) {
    if (forApp) {
      el.setAttribute('data-href', href)
      el.removeAttribute('href')
    }

    el.setAttribute('class', 'markdown-img-link')

    removeChildNodes(el)

    const img = el.ownerDocument.createElement('img')
    img.setAttribute('src', href)
    el.appendChild(img)

    return
  }

  // If a hive post
  const postMatch = href.match(POST_REGEX)
  if (postMatch && WHITE_LIST.includes(postMatch[1].replace(/www./,''))) {
    el.setAttribute('class', 'markdown-post-link')

    const tag = postMatch[2]
    const author = postMatch[3].replace('@', '')
    const permlink = sanitizePermlink(postMatch[4])

    if (!isValidPermlink(permlink)) return;

    const inlineMeta = getInlineMeta(el, href)
    if (inlineMeta.textMatches) {
      el.textContent = `@${author}/${permlink}`
    }
    const isInline = !inlineMeta.nonInline
    if (forApp) {
      el.removeAttribute('href')

      el.setAttribute('data-href', href)
      el.setAttribute('data-is-inline', '' + isInline)
      el.setAttribute('data-tag', tag)
      el.setAttribute('data-author', author)
      el.setAttribute('data-permlink', permlink)

    } else {
      const h = `/${tag}/@${author}/${permlink}`
      el.setAttribute('href', h)
      el.setAttribute('data-is-inline', '' + isInline)
    }
    return
  }

  // If a hive user with url
  const mentionMatch = href.match(MENTION_REGEX)
  if (mentionMatch && WHITE_LIST.includes(mentionMatch[1].replace(/www./,'')) && mentionMatch.length === 3) {
    const _author = mentionMatch[2].replace('@', '')
    if (!isValidUsername(_author)) return
    const author = _author.toLowerCase()

    el.setAttribute('class', 'markdown-author-link')

    if (author.indexOf('/')===-1) {
      if (el.textContent === href) {
        el.textContent = `@${author}`
      }
      if (forApp) {
        el.removeAttribute('href')

        el.setAttribute('data-author', author)
      } else {
        const h = `/@${author}`
        el.setAttribute('href', h)
      }
    }
    return
  }

  // If a tagged post and profile section links
  const tpostMatch = href.match(INTERNAL_POST_TAG_REGEX)
  if (
    (tpostMatch && tpostMatch.length === 4 && WHITE_LIST.some(v => tpostMatch[1].includes(v))) || (tpostMatch && tpostMatch.length === 4 && tpostMatch[1].indexOf('/') == 0)
  ) {
    // check if permlink is section or section with params ?q=xyz
    if (SECTION_LIST.some(v => tpostMatch[3].includes(v))) {
      el.setAttribute('class', 'markdown-profile-link')
      const author = tpostMatch[2].replace('@', '').toLowerCase()
      const section = tpostMatch[3]

      if (!isValidPermlink(section)) return;
      if (el.textContent === href) {
        el.textContent = `@${author}/${section}`
      }
      if (forApp) {
        const ha = `https://ecency.com/@${author}/${section}`
        el.setAttribute('href', ha)
      } else {
        const h = `/@${author}/${section}`
        el.setAttribute('href', h)
      }
      return
    } else {
      // check if domain is not whitelist and does contain dot (not tag e.g. `/ecency`)
      if (tpostMatch[1] && tpostMatch[1].includes('.') && !WHITE_LIST.some(v => tpostMatch[1].includes(v))) {
        return
      }
      let tag = 'post'
      // check if tag does exist and doesn't include dot likely word/tag
      if (tpostMatch[1] && !tpostMatch[1].includes('.')) {
        [, tag] = tpostMatch
        tag = tag.replace('/', '')
      }

      el.setAttribute('class', 'markdown-post-link')
      const author = tpostMatch[2].replace('@', '')
      const permlink = sanitizePermlink(tpostMatch[3])

      if (!isValidPermlink(permlink)) return;

      const inlineMeta = getInlineMeta(el, href)
      if (inlineMeta.textMatches) {
        el.textContent = `@${author}/${permlink}`
      }
      const isInline = !inlineMeta.nonInline
      if (forApp) {
        el.removeAttribute('href')

        el.setAttribute('data-href', href)
        el.setAttribute('data-is-inline', '' + isInline)
        el.setAttribute('data-tag', tag)
        el.setAttribute('data-author', author)
        el.setAttribute('data-permlink', permlink)

      } else {
        const h = `/${tag}/@${author}/${permlink}`
        el.setAttribute('href', h)
        el.setAttribute('data-is-inline', '' + isInline)
      }

      return
    }
  }

  // If a hive user with internal url
  const imentionMatch = href.match(INTERNAL_MENTION_REGEX)
  if (imentionMatch) {
    const _author = imentionMatch[0].replace('/@', '')
    if (!isValidUsername(_author)) return
    const author = _author.toLowerCase()

    el.setAttribute('class', 'markdown-author-link')
    if (author.indexOf('/')===-1) {
      if (el.textContent === href) {
        el.textContent = `@${author}`
      }
      if (forApp) {
        el.removeAttribute('href')

        el.setAttribute('data-author', author)
      } else {
        const h = `/@${author}`
        el.setAttribute('href', h)
      }
    }
    return
  }

  // If a copied post and profile section links
  const cpostMatch = href.match(INTERNAL_POST_REGEX)
  if (
    (cpostMatch && cpostMatch.length === 3 && cpostMatch[1].indexOf('@') === 0)
  ) {
    if (SECTION_LIST.some(v => cpostMatch[2].includes(v))) {
      el.setAttribute('class', 'markdown-profile-link')
      const author = cpostMatch[1].replace('@', '').toLowerCase()
      const section = cpostMatch[2]

      if (el.textContent === href) {
        el.textContent = `@${author}/${section}`
      }
      if (forApp) {
        const ha = `https://ecency.com/@${author}/${section}`
        el.setAttribute('href', ha)
      } else {
        const h = `/@${author}/${section}`
        el.setAttribute('href', h)
      }
      return
    } else {
      el.setAttribute('class', 'markdown-post-link')

      const tag = 'post'

      const author = cpostMatch[1].replace('@', '')
      const permlink = sanitizePermlink(cpostMatch[2])

      if (!isValidPermlink(permlink)) return;

      const inlineMeta = getInlineMeta(el, href)

      if (inlineMeta.textMatches) {
        el.textContent = `@${author}/${permlink}`
      }
      const isInline = !inlineMeta.nonInline
      if (forApp) {
        el.removeAttribute('href')

        el.setAttribute('data-href', href)
        el.setAttribute('data-is-inline', '' + isInline)
        el.setAttribute('data-tag', tag)
        el.setAttribute('data-author', author)
        el.setAttribute('data-permlink', permlink)
      } else {
        const h = `/${tag}/@${author}/${permlink}`
        el.setAttribute('href', h)
        el.setAttribute('data-is-inline', '' + isInline)
      }

      return
    }
  }

  // If topic with filters url
  const topicMatch = href.match(TOPIC_REGEX)
  if (topicMatch && WHITE_LIST.includes(topicMatch[1].replace(/www./,'')) && topicMatch.length === 4) {
    el.setAttribute('class', 'markdown-tag-link')
    const filter = topicMatch[2]
    const tag = topicMatch[3]

    if (el.textContent === href) {
      el.textContent = `/${filter}/${tag}`
    }
    if (forApp) {
      el.removeAttribute('href')

      el.setAttribute('data-filter', filter)
      el.setAttribute('data-tag', tag)
    } else {
      const h = `/${filter}/${tag}`
      el.setAttribute('href', h)
    }
    return
  }

  // If topic with filters internal url
  const itopicMatch = href.match(INTERNAL_TOPIC_REGEX)
  if (itopicMatch && itopicMatch.length === 3) {
    el.setAttribute('class', 'markdown-tag-link')
    const filter = itopicMatch[1]
    const tag = itopicMatch[2]

    if (el.textContent === href) {
      el.textContent = `/${filter}/${tag}`
    }
    if (forApp) {
      el.removeAttribute('href')

      el.setAttribute('data-filter', filter)
      el.setAttribute('data-tag', tag)
    } else {
      const h = `/${filter}/${tag}`
      el.setAttribute('href', h)
    }
    return
  }

  // If a custom hive community link
  const comMatch = href.match(CUSTOM_COMMUNITY_REGEX)
  if (comMatch && WHITE_LIST.includes(comMatch[1])) {
    el.setAttribute('class', 'markdown-community-link')

    const community = comMatch[2]
    let filter = comMatch[3].substring(1)
    if (!filter) filter = 'created'
    if (filter === 'about' || filter === 'discord') {
      filter = 'created'
    }
    if (el.textContent === href) {
      el.textContent = `${filter}/${community}`
    }

    if (forApp) {
      el.removeAttribute('href')

      el.setAttribute('data-community', community)
      el.setAttribute('data-filter', filter)
    } else {
      const h = `/${filter}/${community}`
      el.setAttribute('href', h)
    }
    return
  }

  // If a collections post
  const cccMatch = href.match(CCC_REGEX)
  if (cccMatch && WHITE_LIST.includes(cccMatch[1])) {
    el.setAttribute('class', 'markdown-post-link')

    const tag = 'ccc'
    const author = cccMatch[2].replace('@', '')
    const permlink = sanitizePermlink(cccMatch[3])

    if (!isValidPermlink(permlink)) return;

    const inlineMeta = getInlineMeta(el, href)

    if (inlineMeta.textMatches) {
      el.textContent = `@${author}/${permlink}`
    }
    const isInline = !inlineMeta.nonInline
    if (forApp) {
      el.removeAttribute('href')

      el.setAttribute('data-href', href)
      el.setAttribute('data-is-inline', '' + isInline)
      el.setAttribute('data-tag', tag)
      el.setAttribute('data-author', author)
      el.setAttribute('data-permlink', permlink)
    } else {
      const h = `/${tag}/@${author}/${permlink}`
      el.setAttribute('href', h)
      el.setAttribute('data-is-inline', '' + isInline)
    }
    return
  }


  const BCmatch = href.match(BITCHUTE_REGEX)
  if (BCmatch && BCmatch[1] && el.textContent.trim() === href) {
    const vid = BCmatch[1]
    el.setAttribute('class', 'markdown-video-link')
    el.removeAttribute('href')

    const embedSrc = `https://www.bitchute.com/embed/${vid}/`

    el.textContent = ''

    el.setAttribute('data-embed-src', embedSrc)
    const play = el.ownerDocument.createElement('span')
    play.setAttribute('class', 'markdown-video-play')
    el.appendChild(play)
    return
  }

  const RBmatch = href.match(RUMBLE_REGEX)
  if (RBmatch && el.textContent.trim() === href) {
    const e = RUMBLE_REGEX.exec(href)
    if (e[1]) {
      const vid = e[1]
      const embedSrc = `https://www.rumble.com/embed/${vid}/?pub=4`
      el.setAttribute('class', 'markdown-video-link')
      el.removeAttribute('href')

      el.textContent = ''
      el.setAttribute('data-embed-src', embedSrc)
      const play = el.ownerDocument.createElement('span')
      play.setAttribute('class', 'markdown-video-play')
      el.appendChild(play)
      return
    }
  }

  const BNmatch = href.match(BRIGHTEON_REGEX)
  if (BNmatch && el.textContent.trim() === href) {
    const e = BRIGHTEON_REGEX.exec(href)
    if (e[2]) {
      const vid = e[2]
      const embedSrc = `https://www.brighteon.com/embed/${vid}`
      el.setAttribute('class', 'markdown-video-link')
      el.removeAttribute('href')

      el.textContent = ''
      el.setAttribute('data-embed-src', embedSrc)
      const play = el.ownerDocument.createElement('span')
      play.setAttribute('class', 'markdown-video-play')
      el.appendChild(play)
      return
    }
  }

  // If a youtube video
  let match = href.match(YOUTUBE_REGEX)
  if (match && el.textContent.trim() === href) {
    const e = YOUTUBE_REGEX.exec(href)
    if (e[1]) {
      el.setAttribute('class', 'markdown-video-link markdown-video-link-youtube')
      el.removeAttribute('href')

      const vid = e[1]
      const thumbnail = proxifyImageSrc(`https://img.youtube.com/vi/${vid.split('?')[0]}/hqdefault.jpg`, 0, 0, webp ? 'webp' : 'match')
      const embedSrc = `https://www.youtube.com/embed/${vid}?autoplay=1`

      el.textContent = ''

      el.setAttribute('data-embed-src', embedSrc);
      el.setAttribute('data-youtube', vid);

      //extract start time if available
      const startTime = extractYtStartTime(href);
      if(startTime){
        el.setAttribute('data-start-time', startTime);
      }

      const thumbImg = el.ownerDocument.createElement('img')
      thumbImg.setAttribute('class', 'no-replace video-thumbnail')
      thumbImg.setAttribute('itemprop', 'thumbnailUrl')
      thumbImg.setAttribute('src', thumbnail)

      const play = el.ownerDocument.createElement('span')
      play.setAttribute('class', 'markdown-video-play')

      el.appendChild(thumbImg)
      el.appendChild(play)

      return
    }
  }

  // If vimeo video
  match = href.match(VIMEO_REGEX)
  if (match && href === el.textContent) {
    const e = VIMEO_REGEX.exec(href)
    if (e[3]) {
      el.setAttribute('class', 'markdown-video-link markdown-video-link-vimeo')
      el.removeAttribute('href')

      const embedSrc = `https://player.vimeo.com/video/${e[3]}`

      el.textContent = ''

      const ifr = el.ownerDocument.createElement('iframe')
      ifr.setAttribute('frameborder', '0')
      ifr.setAttribute('allowfullscreen', 'true')
      ifr.setAttribute('src', embedSrc)
      el.appendChild(ifr)

      return
    }
  }

  // If twitch video
  match = href.match(TWITCH_REGEX)
  if (match && href === el.textContent) {
    const e = TWITCH_REGEX.exec(href)
    if (e[2]) {
      el.setAttribute('class', 'markdown-video-link markdown-video-link-twitch')
      el.removeAttribute('href')

      let embedSrc = ''

      if (e[1] === undefined) {
        embedSrc = `https://player.twitch.tv/?channel=${e[2]}`
      } else {
        embedSrc = `https://player.twitch.tv/?video=${e[1]}`
      }

      el.textContent = ''

      const ifr = el.ownerDocument.createElement('iframe')
      ifr.setAttribute('frameborder', '0')
      ifr.setAttribute('allowfullscreen', 'true')
      ifr.setAttribute('src', embedSrc)
      el.appendChild(ifr)

      return
    }
  }

  // If a spotify audio
  match = href.match(SPOTIFY_REGEX)
  if (match && el.textContent.trim() === href) {
    const e = SPOTIFY_REGEX.exec(href)
    if (e[1]) {

      el.setAttribute('class', 'markdown-audio-link markdown-audio-link-spotify')
      el.removeAttribute('href')

      const embedSrc = `https://open.spotify.com/embed/playlist/${e[1]}`

      el.textContent = ''

      const ifr = el.ownerDocument.createElement('iframe')
      ifr.setAttribute('frameborder', '0')
      ifr.setAttribute('allowfullscreen', 'true')
      ifr.setAttribute('src', embedSrc)
      ifr.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups')
      el.appendChild(ifr)

      return
    }
  }

  // If a spotify audio
  match = href.match(LOOM_REGEX)
  if (match && el.textContent.trim() === href) {
    const e = LOOM_REGEX.exec(href)
    if (e[2]) {

      el.setAttribute('class', 'markdown-video-link markdown-video-link-loom')
      el.removeAttribute('href')

      const embedSrc = `https://www.loom.com/embed/${e[2]}`

      el.textContent = ''

      const ifr = el.ownerDocument.createElement('iframe')
      ifr.setAttribute('frameborder', '0')
      ifr.setAttribute('allowfullscreen', 'true')
      ifr.setAttribute('src', embedSrc)
      ifr.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups')
      el.appendChild(ifr)

      return
    }
  }

  // If a d.tube video
  match = href.match(D_TUBE_REGEX)
  if (match) {

     // Only d.tube links contains an image
     const imgEls = el.getElementsByTagName('img')

     if (imgEls.length === 1 || el.textContent.trim() === href) {
      const e = D_TUBE_REGEX.exec(href)
      // e[2] = username, e[3] object id
      if (e[2] && e[3]) {
        el.setAttribute('class', 'markdown-video-link markdown-video-link-dtube')
        el.removeAttribute('href')


        const videoHref = `https://emb.d.tube/#!/${e[2]}/${e[3]}`

        // el.setAttribute('data-video-href', videoHref)
        el.setAttribute('data-embed-src', videoHref)

        //process thumb img element
        if (imgEls.length === 1) {
          const thumbnail = proxifyImageSrc(imgEls[0].getAttribute('src').replace(/\s+/g, ''), 0, 0, webp ? 'webp' : 'match')
          const thumbImg = el.ownerDocument.createElement('img')

          thumbImg.setAttribute('class', 'no-replace video-thumbnail')
          thumbImg.setAttribute('itemprop', 'thumbnailUrl')

          thumbImg.setAttribute('src', thumbnail)
          el.appendChild(thumbImg)

          // Remove image.
          el.removeChild(imgEls[0])
        } else {
            el.textContent = '';
        }

        const play = el.ownerDocument.createElement('span')
        play.setAttribute('class', 'markdown-video-play')


        el.appendChild(play)

        return
      }
    }
  }
  match = href.match(D_TUBE_REGEX2)
  if (match) {
    const e = D_TUBE_REGEX2.exec(href)
    // e[2] = username, e[3] object id
    if (e[2] && e[3]) {
      el.setAttribute('class', 'markdown-video-link markdown-video-link-dtube')
      el.removeAttribute('href')
      el.textContent = '';

      const videoHref = `https://emb.d.tube/#!/${e[2]}/${e[3]}`

      // el.setAttribute('data-video-href', videoHref);
      el.setAttribute('data-embed-src', videoHref)
      const play = el.ownerDocument.createElement('span')
      play.setAttribute('class', 'markdown-video-play')

      el.appendChild(play)


      return
    }
  }

  // Detect 3Speak
  match = href.match(SPEAK_REGEX)
  if (match) {
    const imgEls = el.getElementsByTagName('img')
    if (imgEls.length === 1 || el.textContent.trim() === href) {
      const e = SPEAK_REGEX.exec(href)
      // e[1] / e[2] = tld , e[3] = embed address
      if ((e[1] || e[2]) && e[3]) {
        const videoHref = `https://3speak.tv/embed?v=${e[3]}`
        el.setAttribute('class', 'markdown-video-link markdown-video-link-speak')
        el.removeAttribute('href')
        el.setAttribute('data-embed-src', videoHref)
        if (el.textContent.trim() === href) {
          el.textContent = ''
        }
        if (imgEls.length === 1) {
          const thumbnail = proxifyImageSrc(imgEls[0].getAttribute('src').replace(/\s+/g, ''), 0, 0, webp ? 'webp' : 'match')
          const thumbImg = el.ownerDocument.createElement('img')
          thumbImg.setAttribute('class', 'no-replace video-thumbnail')
          thumbImg.setAttribute('itemprop', 'thumbnailUrl')
          thumbImg.setAttribute('src', thumbnail)
          el.appendChild(thumbImg)
          // Remove image.
          el.removeChild(imgEls[0])
        }

        const play = el.ownerDocument.createElement('span')
        play.setAttribute('class', 'markdown-video-play')
        el.appendChild(play)
        return
      }
    }
  }

  // If tweets
  const matchT = href.match(TWITTER_REGEX)
  if (matchT && el.textContent.trim() === href) {
    const e = TWITTER_REGEX.exec(href)
    if (e) {
      const url = e[0].replace(/(<([^>]+)>)/gi, '')
      const author = e[1].replace(/(<([^>]+)>)/gi, '')

      const twitterCode = `<blockquote class="twitter-tweet"><p>${url}</p>- <a href="${url}">${author}</a></blockquote>`
      const doc = DOMParser.parseFromString(twitterCode, 'text/html')
      const replaceNode = doc.documentElement || doc.firstChild
      el.parentNode.replaceChild(replaceNode, el)
      return
    }
  }

  if (href.indexOf('https://hivesigner.com/sign/account-witness-vote?witness=') === 0 && forApp) {
    el.setAttribute('class', 'markdown-witnesses-link')
    el.setAttribute('data-href', href)
    el.removeAttribute('href')
    return
  }

  if (href.indexOf('hivesigner.com/sign/update-proposal-votes?proposal_ids') > 0 && forApp) {
    const m = decodeURI(href).match(/proposal_ids=\[(\d+)]/)
    if (m) {
      el.setAttribute('class', 'markdown-proposal-link')
      el.setAttribute('data-href', href)
      el.setAttribute('data-proposal', m[1])
      el.removeAttribute('href')
      return
    }
  }

  // If nothing matched element as external link so it will be opened in external window
  el.setAttribute('class', 'markdown-external-link')

  // Prepend https if no scheme provided
  if (!(/^((#)|(mailto:)|(\/(?!\/))|(((steem|hive|esteem|ecency|https?):)?\/\/))/.test(href))) {
    href = `https://${href}`
  }

  if (forApp) {
    el.setAttribute('data-href', href)
    const match = href.match(YOUTUBE_REGEX)
    if (match) {
      const e = YOUTUBE_REGEX.exec(href)
      if (e[1]) {
        const vid = e[1]
        el.setAttribute('data-youtube', vid);

        //extract start time if available
        const startTime = extractYtStartTime(href);
        if(startTime){
          el.setAttribute('data-start-time', startTime);
        }
      }
    }
    el.removeAttribute('href')
  } else {
    const matchS = href.match(SECTION_REGEX)
    if(matchS) {
      el.setAttribute('class', 'markdown-internal-link');
    } else {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    }
  }
}



