/**
 * SEO context for controlling rel attributes on external links in user-generated content.
 *
 * By default, all external links get rel="nofollow ugc noopener" to prevent link spam.
 * High-quality content (high author reputation + meaningful post rewards) earns followed links.
 */
export interface SeoContext {
  /** Human-readable author reputation score (after accountReputation() conversion) */
  authorReputation?: number;
  /** Total post payout in USD */
  postPayout?: number;
}
