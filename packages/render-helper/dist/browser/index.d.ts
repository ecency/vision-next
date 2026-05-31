/**
 * Entry interface for Hive post data
 */
interface Entry {
    author?: string;
    permlink?: string;
    last_update?: string;
    body: any;
    json_metadata?: any;
}

interface RenderOptions {
    /** When true, video embeds (3Speak, YouTube, etc.) render as iframes directly without a play button overlay. */
    embedVideosDirectly?: boolean;
}

/**
 * SEO context for controlling rel attributes on external links in user-generated content.
 *
 * By default, all external links get rel="nofollow ugc noopener" to prevent link spam.
 * High-quality content (high author reputation + meaningful post rewards) earns followed links.
 */
interface SeoContext {
    /** Human-readable author reputation score (after accountReputation() conversion) */
    authorReputation?: number;
    /** Total post payout in USD */
    postPayout?: number;
}

declare function setSlowRenderThresholdMs(ms: number): void;
/**
 * @param obj - Entry object or raw markdown string
 * @param forApp - Whether rendering for app context
 * @param _webp - @deprecated Ignored. Format is now handled server-side via Accept header content negotiation.
 * @param parentDomain - Parent domain for iframe embed parameters
 * @param seoContext - Optional SEO context for structured data
 * @param renderOptions - Optional rendering options (e.g. embedVideosDirectly)
 */
declare function markdown2Html(obj: Entry | string, forApp?: boolean, _webp?: boolean, parentDomain?: string, seoContext?: SeoContext, renderOptions?: RenderOptions): string;

declare function catchPostImage(obj: Entry | string, width?: number, height?: number, format?: string): string | null;

/**
 * Generate a text summary from an Entry object or raw string
 * @param obj - Entry object or raw post body string
 * @param length - Maximum length of the summary (default: 200, use 0 for no truncation)
 * @param platform - Target platform: 'web' for browser/Node.js, 'ios'/'android' for React Native (default: 'web')
 *                   Controls entity/placeholder handling - 'web' skips placeholder substitution, other values enable it
 * @returns Text summary of the post body
 */
declare function getPostBodySummary(obj: Entry | string, length?: number, platform?: 'ios' | 'android' | 'web'): string;

declare function setProxyBase(p: string): void;
interface ProxifyOptions {
    /**
     * Request a tiny blurred LQIP placeholder. The proxy resizes to ~20px and
     * gaussian-blurs it (a few hundred bytes), for use behind the real image
     * while it loads.
     */
    blur?: boolean;
    /**
     * Route on-host uploads through the /p/ proxy even when no width/height is
     * requested, so the server still negotiates WebP/AVIF via the Accept header
     * (instead of streaming the original bytes from direct-serve). Use for
     * displayed `<img>` sources; leave off for OG/social images, where the
     * original format is safest.
     */
    forceProxy?: boolean;
}
/**
 * @param _format - @deprecated Ignored. Always uses 'match' — format is handled server-side via Accept header.
 */
declare function proxifyImageSrc(url?: string, width?: number, height?: number, _format?: string, opts?: ProxifyOptions): string;
/**
 * Builds a srcset string with multiple width variants for responsive images.
 * Uses the image proxy's width parameter to serve appropriately sized images.
 */
declare function buildSrcSet(url?: string): string;

/**
 * The `sizes` value the renderer applies to in-body post images (see `img()`
 * and `createImageHTML()`). Exported as the single source of truth so consumers
 * preloading the LCP image (`<link rel="preload" as="image" imagesizes>`) can
 * match the exact srcset candidate the rendered <img> selects.
 */
declare const IMAGE_SIZES = "(max-width: 768px) 100vw, 700px";

declare function setCacheSize(size: number): void;

declare const SECTION_LIST: string[];

declare function isValidPermlink(permlink: string): boolean;

/**
 * Lightweight markdown-to-HTML conversion with sanitization.
 * Unlike the full `markdownToHTML`, this skips Hive-specific transforms
 * (image proxying, link internalizing, DOM traversal, etc.).
 *
 * Intended for editor input (TipTap), chat messages, and other contexts
 * where simple markdown rendering is sufficient.
 */
declare function simpleMarkdownToHTML(input: string): string;

export { type Entry, IMAGE_SIZES, type ProxifyOptions, type RenderOptions, SECTION_LIST, type SeoContext, buildSrcSet, catchPostImage, isValidPermlink, getPostBodySummary as postBodySummary, proxifyImageSrc, markdown2Html as renderPostBody, setCacheSize, setProxyBase, setSlowRenderThresholdMs, simpleMarkdownToHTML };
