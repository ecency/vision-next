interface Entry {
    author?: string;
    permlink?: string;
    last_update?: string;
    body: any;
    json_metadata?: any;
}

declare function markdown2Html(obj: Entry | string, forApp?: boolean, webp?: boolean): string;

declare function catchPostImage(obj: Entry | string, width?: number, height?: number, format?: string): string | null;

/**
 * Generate a text summary from an Entry object or raw string
 * @param obj - Entry object or raw post body string
 * @param length - Maximum length of the summary (default: 200)
 * @param platform - Target platform: 'web' for browser/Node.js, 'ios'/'android' for React Native (default: 'web')
 *                   Determines which crypto implementation to use ('web' = standard, other = react-native-crypto-js)
 * @returns Text summary of the post body
 */
declare function getPostBodySummary(obj: Entry | string, length?: number, platform?: 'ios' | 'android' | 'web'): any;

declare function setProxyBase(p: string): void;
declare function proxifyImageSrc(url?: string, width?: number, height?: number, format?: string): string;

declare function setCacheSize(size: number): void;

declare const SECTION_LIST: string[];

declare function isValidPermlink(permlink: string): boolean;

export { SECTION_LIST, catchPostImage, isValidPermlink, getPostBodySummary as postBodySummary, proxifyImageSrc, markdown2Html as renderPostBody, setCacheSize, setProxyBase };
