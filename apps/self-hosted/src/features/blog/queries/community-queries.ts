import { CONFIG, type Entry } from '@ecency/sdk';
import {
  infiniteQueryOptions,
  queryOptions,
} from '@tanstack/react-query';
import type { Community } from './types';

export type { Community };

/**
 * Get community details
 */
export function getCommunityQueryOptions(communityId: string) {
  return queryOptions({
    queryKey: ['community', communityId],
    enabled: !!communityId,
    queryFn: async () => {
      const result = await CONFIG.hiveClient.call('bridge', 'get_community', {
        name: communityId,
        observer: '',
      });
      return result as Community | null;
    },
  });
}

/**
 * Get community posts (ranked posts with community tag)
 */
export function getCommunityPostsInfiniteQueryOptions(
  communityId: string,
  sort: string = 'created',
  limit: number = 20
) {
  return infiniteQueryOptions({
    queryKey: ['community-posts', communityId, sort, limit],
    enabled: !!communityId,
    initialPageParam: { start_author: '', start_permlink: '' },
    queryFn: async ({ pageParam }) => {
      const result = await CONFIG.hiveClient.call('bridge', 'get_ranked_posts', {
        sort,
        tag: communityId,
        start_author: pageParam.start_author,
        start_permlink: pageParam.start_permlink,
        limit,
        observer: '',
      });
      return (result as Entry[]) || [];
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < limit) {
        return undefined;
      }
      const lastPost = lastPage[lastPage.length - 1];
      return {
        start_author: lastPost.author,
        start_permlink: lastPost.permlink,
      };
    },
  });
}

/**
 * Get community subscribers count
 */
export function getCommunitySubscribersQueryOptions(communityId: string) {
  return queryOptions({
    queryKey: ['community-subscribers', communityId],
    enabled: !!communityId,
    queryFn: async () => {
      const result = await CONFIG.hiveClient.call('bridge', 'list_subscribers', {
        community: communityId,
      });
      return (result as Array<unknown>)?.length || 0;
    },
  });
}
