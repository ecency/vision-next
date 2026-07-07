import { describe, it, expect } from 'vitest';
import { resolvePublishTarget } from './publish-target';

describe('resolvePublishTarget', () => {
  it('uses the first tag as category in blog mode', () => {
    const result = resolvePublishTarget({
      tags: ['travel', 'photography'],
      isCommunityMode: false,
      communityId: '',
    });
    expect(result.parentPermlink).toBe('travel');
    expect(result.tags).toEqual(['travel', 'photography']);
  });

  it('normalizes the blog category to lowercase', () => {
    const result = resolvePublishTarget({
      tags: ['Travel', 'Photography'],
      isCommunityMode: false,
      communityId: '',
    });
    expect(result.parentPermlink).toBe('travel');
    // Tags themselves are preserved as entered.
    expect(result.tags).toEqual(['Travel', 'Photography']);
  });

  it('publishes into the community with the community id as category', () => {
    const result = resolvePublishTarget({
      tags: ['travel', 'photography'],
      isCommunityMode: true,
      communityId: 'hive-12345',
    });
    expect(result.parentPermlink).toBe('hive-12345');
    expect(result.tags).toEqual(['hive-12345', 'travel', 'photography']);
  });

  it('does not duplicate the community tag when already present', () => {
    const result = resolvePublishTarget({
      tags: ['hive-12345', 'travel'],
      isCommunityMode: true,
      communityId: 'hive-12345',
    });
    expect(result.tags).toEqual(['hive-12345', 'travel']);
  });

  it('falls back to blog behavior when community mode has no community id', () => {
    const result = resolvePublishTarget({
      tags: ['travel'],
      isCommunityMode: true,
      communityId: '',
    });
    expect(result.parentPermlink).toBe('travel');
    expect(result.tags).toEqual(['travel']);
  });

  it('handles an empty tag list without throwing', () => {
    const result = resolvePublishTarget({
      tags: [],
      isCommunityMode: false,
      communityId: '',
    });
    expect(result.parentPermlink).toBe('');
    expect(result.tags).toEqual([]);
  });
});
