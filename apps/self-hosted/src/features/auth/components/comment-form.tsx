'use client';

import type { Operation } from '@hiveio/dhive';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useAuth, useIsAuthenticated, useIsAuthEnabled } from '../hooks';
import { t } from '@/core';

interface CommentFormProps {
  parentAuthor: string;
  parentPermlink: string;
  onSuccess?: () => void;
  className?: string;
}

export function CommentForm({
  parentAuthor,
  parentPermlink,
  onSuccess,
  className,
}: CommentFormProps) {
  const { user, broadcast } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const isAuthEnabled = useIsAuthEnabled();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!user || !body.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Generate unique permlink for the comment
      const permlink = `re-${parentAuthor.replace(/\./g, '')}-${Date.now()}`;

      // Create the comment operation
      const commentOp: Operation = [
        'comment',
        {
          parent_author: parentAuthor,
          parent_permlink: parentPermlink,
          author: user.username,
          permlink,
          title: '',
          body: body.trim(),
          json_metadata: JSON.stringify({
            tags: [],
            app: 'ecency-selfhost/1.0',
          }),
        },
      ];

      await broadcast([commentOp]);

      // Clear form and refresh comments
      setBody('');
      queryClient.invalidateQueries({
        queryKey: ['discussion', parentAuthor, parentPermlink],
      });
      queryClient.invalidateQueries({
        queryKey: ['entry', parentAuthor, parentPermlink],
      });

      onSuccess?.();
    } catch (err) {
      console.error('Comment failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, body, isSubmitting, parentAuthor, parentPermlink, broadcast, queryClient, onSuccess]);

  // If auth is disabled, don't show the form
  if (!isAuthEnabled) {
    return null;
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className={clsx('p-4 border border-theme rounded-lg bg-theme-hover', className)}>
        <p className="text-theme-muted text-sm mb-3">{t('login_to_comment')}</p>
        <Link
          to="/login"
          search={{ redirect: `/@${parentAuthor}/${parentPermlink}` }}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          {t('login')}
        </Link>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-3', className)}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-hover flex items-center justify-center text-sm font-medium text-theme-primary">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('write_comment')}
            className="w-full px-3 py-2 rounded-md border border-theme bg-theme text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-strong resize-none"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 dark:text-red-400">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !body.trim()}
          className={clsx(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            'bg-blue-600 text-white hover:bg-blue-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isSubmitting ? t('posting') : t('post_comment')}
        </button>
      </div>
    </div>
  );
}
