import { markdown2Html as renderPostBody } from './markdown-2-html'
import { catchPostImage } from './catch-post-image'
import { getPostBodySummary as postBodySummary } from './post-body-summary'
import { setProxyBase, proxifyImageSrc } from './proxify-image-src'
import { setCacheSize } from './cache'
import { SECTION_LIST } from './consts'
import { isValidPermlink } from "./helper";
import { simpleMarkdownToHTML } from './methods/simple-markdown-to-html.method'
import type { Entry } from './types/entry.interface'
import type { RenderOptions } from './types/render-options.interface'
import type { SeoContext } from './types/seo-context.interface'

export {
  renderPostBody,
  catchPostImage,
  postBodySummary,
  proxifyImageSrc,
  setProxyBase,
  setCacheSize,
  SECTION_LIST,
  isValidPermlink,
  simpleMarkdownToHTML
}

export type { Entry, RenderOptions, SeoContext }
