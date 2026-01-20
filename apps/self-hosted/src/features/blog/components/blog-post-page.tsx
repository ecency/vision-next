'use client';

import { getPostQueryOptions } from '@ecency/sdk';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearch } from '@tanstack/react-router';
import { InstanceConfigManager, t } from '@/core';
import { BlogLayout } from '../layout/blog-layout';
import { BlogPostBody } from './blog-post-body';
import { BlogPostDiscussion } from './blog-post-discussion';
import { BlogPostFooter } from './blog-post-footer';
import { BlogPostHeader } from './blog-post-header';
import { ErrorMessage } from '@/features/shared/error-message';

export function BlogPostPage() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });

  const showComments = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.instanceConfiguration.features.comments?.enabled ?? true,
  );

  // Handle both URL patterns: /:category/:author/:permlink and /:author/:permlink
  const author = (params.author as string)?.replace('@', '') || '';
  const permlink = (params.permlink as string) || '';
  const isRawContent = search?.raw !== undefined;

  const {
    data: entry,
    isLoading,
    error,
    refetch,
  } = useQuery(getPostQueryOptions(author, permlink));

  if (isLoading) {
    return (
      <BlogLayout>
        <div className="text-center py-12 text-theme-muted">
          {t('loadingPost')}
        </div>
      </BlogLayout>
    );
  }

  if (error) {
    return (
      <BlogLayout>
        <ErrorMessage onRetry={() => refetch()} />
      </BlogLayout>
    );
  }

  if (!entry) {
    return (
      <BlogLayout>
        <div className="text-center py-12 text-theme-muted">
          {t('postNotFound')}
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout>
      <article className="space-y-4 sm:space-y-6">
        <BlogPostHeader entry={entry} />
        <BlogPostBody entry={entry} isRawContent={isRawContent} />
        <BlogPostFooter entry={entry} />
        {showComments && (
          <BlogPostDiscussion entry={entry} isRawContent={isRawContent} />
        )}
      </article>
    </BlogLayout>
  );
}
