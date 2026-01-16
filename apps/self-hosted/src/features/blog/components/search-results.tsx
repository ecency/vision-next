'use client';

import { searchQueryOptions } from '@ecency/sdk';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { t } from '@/core';
import { useInstanceConfig } from '../hooks/use-instance-config';
import { BlogPostItem } from './blog-post-item';

interface Props {
  query: string;
}

export function SearchResults({ query }: Props) {
  const { username, communityId, isCommunityMode } = useInstanceConfig();

  // Build search query scoped to the blog/community
  const scopedQuery = useMemo(() => {
    const baseQuery = query.trim();
    if (!baseQuery) return '';

    if (isCommunityMode && communityId) {
      // Search within community (matches main app format)
      return `${baseQuery} category:${communityId}`;
    }
    // Search within blog author's posts
    return `${baseQuery} author:${username} type:post`;
  }, [query, username, communityId, isCommunityMode]);

  const { data, isLoading, error } = useQuery({
    ...searchQueryOptions(scopedQuery, 'newest', '0'),
    enabled: !!scopedQuery,
  });

  if (!query.trim()) {
    return (
      <div className="text-center py-12 text-theme-muted">
        {t('enter_search_query')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-theme-muted">
        {t('searching')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {t('search_error')}
      </div>
    );
  }

  const results = data?.results || [];

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-theme-muted">
        {t('no_results')}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-sm text-theme-muted">
        {data?.hits || results.length} {t('results_for')} "{query}"
      </div>
      <div className="blog-posts-list">
        {results.map((result, index) => (
          <BlogPostItem
            key={`${result.author}/${result.permlink}`}
            entry={result as any}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
