import { describe, it, expect } from 'vitest';
import { getRssFeedUrl } from './rss-feed-url';

describe('getRssFeedUrl', () => {
  it('returns blog RSS URL for blog type', () => {
    expect(getRssFeedUrl('blog', 'alice', undefined)).toBe(
      'https://ecency.com/@alice/rss',
    );
  });

  it('returns community RSS URL for community type', () => {
    expect(getRssFeedUrl('community', undefined, 'hive-123456')).toBe(
      'https://ecency.com/created/hive-123456/rss',
    );
  });

  it('returns null when blog type is missing username', () => {
    expect(getRssFeedUrl('blog', undefined, undefined)).toBeNull();
  });

  it('returns null when community type is missing communityId', () => {
    expect(getRssFeedUrl('community', 'alice', undefined)).toBeNull();
  });

  it('returns null for blog type with empty username', () => {
    expect(getRssFeedUrl('blog', '', undefined)).toBeNull();
  });

  it('returns null for community type with empty communityId', () => {
    expect(getRssFeedUrl('community', '', '')).toBeNull();
  });

  it('returns null for community type with whitespace communityId', () => {
    expect(getRssFeedUrl('community', '', '   ')).toBeNull();
  });
});
