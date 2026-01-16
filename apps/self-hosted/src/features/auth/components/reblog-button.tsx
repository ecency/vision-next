'use client';

import type { Operation } from '@hiveio/dhive';
import { UilRedo } from '@tooni/iconscout-unicons-react';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { t } from '@/core';
import { useAuth, useIsAuthenticated, useIsAuthEnabled } from '../hooks';

interface ReblogButtonProps {
  author: string;
  permlink: string;
  reblogCount?: number;
  className?: string;
}

export function ReblogButton({
  author,
  permlink,
  reblogCount = 0,
  className,
}: ReblogButtonProps) {
  const { user, broadcast } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const isAuthEnabled = useIsAuthEnabled();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReblogged, setHasReblogged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Can't reblog your own post
  const isOwnPost = user?.username === author;

  const handleReblog = useCallback(async () => {
    if (!user || isSubmitting || isOwnPost || hasReblogged) return;

    // Confirm with user
    const confirmed = window.confirm(
      `Are you sure you want to reblog this post to your followers?`,
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create the reblog custom_json operation
      const reblogOp: Operation = [
        'custom_json',
        {
          required_auths: [],
          required_posting_auths: [user.username],
          id: 'follow',
          json: JSON.stringify([
            'reblog',
            {
              account: user.username,
              author,
              permlink,
            },
          ]),
        },
      ];

      await broadcast([reblogOp]);

      setHasReblogged(true);

      // Invalidate the entry query to refresh reblog count
      queryClient.invalidateQueries({
        queryKey: ['entry', author, permlink],
      });
    } catch (err) {
      console.error('Reblog failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to reblog');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isSubmitting, isOwnPost, hasReblogged, author, permlink, broadcast, queryClient]);

  const buttonLabel = useMemo(() => {
    if (isSubmitting) return t('reblogging');
    return `${reblogCount + (hasReblogged ? 1 : 0)} ${t('reblogs')}`;
  }, [reblogCount, hasReblogged, isSubmitting]);

  // If auth is not enabled, just show count
  if (!isAuthEnabled) {
    return (
      <div className={clsx('flex items-center gap-1 text-theme-muted', className)}>
        <UilRedo className="w-4 h-4" />
        <span>{reblogCount} {t('reblogs')}</span>
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center', className)}>
      <button
        type="button"
        onClick={handleReblog}
        disabled={!isAuthenticated || isSubmitting || isOwnPost || hasReblogged}
        className={clsx(
          'flex items-center gap-1 transition-colors',
          hasReblogged
            ? 'text-green-500'
            : isAuthenticated && !isOwnPost
              ? 'text-theme-muted hover:text-green-500 cursor-pointer'
              : 'text-theme-muted cursor-not-allowed',
        )}
        title={
          !isAuthenticated
            ? 'Login to reblog'
            : isOwnPost
              ? "You can't reblog your own post"
              : hasReblogged
                ? 'Already reblogged'
                : 'Reblog to your followers'
        }
      >
        <UilRedo className="w-4 h-4" />
        <span>{buttonLabel}</span>
      </button>
      {error && (
        <span className="ml-2 text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
