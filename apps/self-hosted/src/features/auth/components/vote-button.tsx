'use client';

import { UilHeart } from '@tooni/iconscout-unicons-react';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth, useIsAuthenticated, useIsAuthEnabled } from '../hooks';
import { Link } from '@tanstack/react-router';
import { t } from '@/core';

interface Vote {
  voter: string;
  weight?: number;
  percent?: number;
  rshares?: string | number;
}

interface VoteButtonProps {
  author: string;
  permlink: string;
  activeVotes: Vote[];
  showCount?: boolean;
  className?: string;
}

export function VoteButton({
  author,
  permlink,
  activeVotes,
  showCount = true,
  className,
}: VoteButtonProps) {
  const { user, broadcast } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const isAuthEnabled = useIsAuthEnabled();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  // Check if user has voted
  const userVote = useMemo(() => {
    if (!user) return null;
    return activeVotes.find(
      (v) => v.voter.toLowerCase() === user.username.toLowerCase()
    );
  }, [activeVotes, user]);

  const hasVoted = !!userVote && (userVote.weight ?? userVote.percent ?? 0) > 0;
  const voteCount = activeVotes.length;

  const handleVote = useCallback(async () => {
    if (!user || isVoting) return;

    setIsVoting(true);
    try {
      // Toggle vote: if already voted, remove vote (weight 0), else upvote (weight 10000 = 100%)
      const weight = hasVoted ? 0 : 10000;

      await broadcast([
        [
          'vote',
          {
            voter: user.username,
            author,
            permlink,
            weight,
          },
        ],
      ]);

      // Invalidate queries to refresh vote data
      queryClient.invalidateQueries({ queryKey: ['entry', author, permlink] });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
    }
  }, [user, isVoting, hasVoted, author, permlink, broadcast, queryClient]);

  // If auth is disabled, show static display
  if (!isAuthEnabled) {
    return (
      <div className={clsx('flex items-center gap-1 text-theme-muted', className)}>
        <UilHeart className="w-4 h-4" />
        {showCount && <span>{voteCount} {t('likes')}</span>}
      </div>
    );
  }

  // If not authenticated, show login link
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        search={{ redirect: `/@${author}/${permlink}` }}
        className={clsx(
          'flex items-center gap-1 text-theme-muted hover:text-theme-primary transition-colors',
          className
        )}
      >
        <UilHeart className="w-4 h-4" />
        {showCount && <span>{voteCount} {t('likes')}</span>}
      </Link>
    );
  }

  // Authenticated user - show interactive button
  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={isVoting}
      className={clsx(
        'flex items-center gap-1 transition-colors',
        hasVoted
          ? 'text-red-500 hover:text-red-600'
          : 'text-theme-muted hover:text-red-500',
        isVoting && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <UilHeart
        className={clsx('w-4 h-4', hasVoted && 'fill-current')}
      />
      {showCount && <span>{voteCount} {t('likes')}</span>}
    </button>
  );
}
