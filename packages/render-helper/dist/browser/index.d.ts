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

/**
 * @param obj - Entry object or raw markdown string
 * @param forApp - Whether rendering for app context
 * @param _webp - @deprecated Ignored. Format is now handled server-side via Accept header content negotiation.
 * @param parentDomain - Parent domain for iframe embed parameters
 * @param seoContext - Optional SEO context for structured data
 */
declare function markdown2Html(obj: Entry | string, forApp?: boolean, _webp?: boolean, parentDomain?: string, seoContext?: SeoContext): string;

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
/**
 * @param _format - @deprecated Ignored. Always uses 'match' — format is handled server-side via Accept header.
 */
declare function proxifyImageSrc(url?: string, width?: number, height?: number, _format?: string): string;

declare function setCacheSize(size: number): void;

declare const SECTION_LIST: string[];

declare function isValidPermlink(permlink: string): boolean;

export { type Entry, SECTION_LIST, type SeoContext, catchPostImage, isValidPermlink, getPostBodySummary as postBodySummary, proxifyImageSrc, markdown2Html as renderPostBody, setCacheSize, setProxyBase };
