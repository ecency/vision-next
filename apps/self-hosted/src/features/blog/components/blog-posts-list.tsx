'use client';

import { getAccountPostsInfiniteQueryOptions } from '@ecency/sdk';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { t } from '@/core';
import { BlogPostItem } from './blog-post-item';
import { DetectBottom } from './detect-bottom';
import { useInstanceConfig } from '../hooks/use-instance-config';
import { getCommunityPostsInfiniteQueryOptions } from '../queries/community-queries';

interface Props {
  filter?: string;
  limit?: number;
}

// Map blog filters to community sort options
const communityFilterMap: Record<string, string> = {
  posts: 'created',
  blog: 'created',
  trending: 'trending',
  hot: 'hot',
  new: 'created',
  payout: 'payout',
  muted: 'muted',
};

export function BlogPostsList({ filter = 'posts', limit = 20 }: Props) {
  const { username, communityId, isCommunityMode } = useInstanceConfig();

  // Use different query based on instance type
  const communitySort = communityFilterMap[filter] || 'created';

  const blogQuery = useInfiniteQuery({
    ...getAccountPostsInfiniteQueryOptions(username, filter, limit),
    select: (data) => data.pages.flat(),
    enabled: !isCommunityMode,
  });

  const communityQuery = useInfiniteQuery({
    ...getCommunityPostsInfiniteQueryOptions(communityId, communitySort, limit),
    select: (data) => data.pages.flat(),
    enabled: isCommunityMode,
  });

  const { data = [], fetchNextPage, isFetching, hasNextPage } = isCommunityMode
    ? communityQuery
    : blogQuery;

  const previousLengthRef = useRef(0);

  useEffect(() => {
    // If data length decreased (e.g., filter changed), reset the ref
    if (data.length < previousLengthRef.current) {
      previousLengthRef.current = 0;
    } else {
      previousLengthRef.current = data.length;
    }
  }, [data.length]);

  return (
    <div className="blog-posts-list">
      {data.length === 0 && !isFetching && (
        <div className="text-center py-12 text-theme-muted">{t('noPosts')}</div>
      )}

      {data.map((post, index) => {
        const isNewItem = index >= previousLengthRef.current;
        const batchIndex = isNewItem ? index - previousLengthRef.current : 0;
        return (
          <BlogPostItem
            key={`${post.author}/${post.permlink}`}
            entry={post}
            index={batchIndex}
          />
        );
      })}

      {hasNextPage && <DetectBottom onBottom={() => fetchNextPage()} />}

      {isFetching && (
        <div className="text-center py-8 text-theme-muted">
          {t('loadingMore')}
        </div>
      )}
    </div>
  );
}
