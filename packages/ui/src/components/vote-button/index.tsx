'use client';

import { clsx } from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import type { Vote } from '../../types';

export interface VoteButtonProps {
  /** Post author username */
  author: string;
  /** Post permlink */
  permlink: string;
  /** List of active votes on the post */
  activeVotes: Vote[];
  /** Current user's username (null if not logged in) */
  currentUser?: string | null;
  /** Whether voting is enabled */
  isVotingEnabled?: boolean;
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  /** Callback to handle vote action */
  onVote?: (params: { author: string; permlink: string; weight: number }) => Promise<void>;
  /** Callback when unauthenticated user clicks (e.g., redirect to login) */
  onAuthRequired?: () => void;
  /** Whether to show vote count */
  showCount?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom labels */
  labels?: {
    likes?: string;
    login?: string;
  };
  /** Custom icon component */
  icon?: React.ReactNode;
}

/**
 * Default heart icon
 */
function HeartIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

/**
 * VoteButton allows users to upvote/downvote content on the Hive blockchain.
 *
 * Features:
 * - Shows current vote count
 * - Indicates if current user has voted
 * - Handles loading states
 * - Customizable for different auth patterns
 *
 * @example
 * ```tsx
 * // Basic usage with auth
 * <VoteButton
 *   author="ecency"
 *   permlink="my-post"
 *   activeVotes={votes}
 *   currentUser="myuser"
 *   isAuthenticated={true}
 *   onVote={async ({ author, permlink, weight }) => {
 *     await broadcastVote(author, permlink, weight);
 *   }}
 * />
 *
 * // Without auth (display only)
 * <VoteButton
 *   author="ecency"
 *   permlink="my-post"
 *   activeVotes={votes}
 *   isVotingEnabled={false}
 * />
 * ```
 */
export function VoteButton({
  author,
  permlink,
  activeVotes,
  currentUser,
  isVotingEnabled = true,
  isAuthenticated = false,
  onVote,
  onAuthRequired,
  showCount = true,
  className,
  labels = {},
  icon,
}: VoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false);

  const { likes = 'likes', login = 'Login to vote' } = labels;

  // Check if current user has voted
  const userVote = useMemo(() => {
    if (!currentUser) return null;
    return activeVotes.find(
      (v) => v.voter.toLowerCase() === currentUser.toLowerCase()
    );
  }, [activeVotes, currentUser]);

  const hasVoted = !!userVote && (userVote.weight ?? userVote.percent ?? 0) > 0;
  const voteCount = activeVotes.length;

  const handleVote = useCallback(async () => {
    if (!currentUser || isVoting || !onVote) return;

    setIsVoting(true);
    try {
      // Toggle vote: if already voted, remove (weight 0), else upvote (weight 10000 = 100%)
      const weight = hasVoted ? 0 : 10000;
      await onVote({ author, permlink, weight });
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
    }
  }, [currentUser, isVoting, hasVoted, author, permlink, onVote]);

  const handleClick = useCallback(() => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    handleVote();
  }, [isAuthenticated, onAuthRequired, handleVote]);

  const iconElement = icon || (
    <HeartIcon filled={hasVoted} className="w-4 h-4" />
  );

  // If voting is disabled, show static display
  if (!isVotingEnabled) {
    return (
      <div
        className={clsx(
          'flex items-center gap-1 text-gray-500 dark:text-gray-400',
          className
        )}
      >
        {iconElement}
        {showCount && (
          <span>
            {voteCount} {likes}
          </span>
        )}
      </div>
    );
  }

  // If not authenticated, show clickable element that triggers auth
  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={clsx(
          'flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors',
          className
        )}
        title={login}
      >
        {iconElement}
        {showCount && (
          <span>
            {voteCount} {likes}
          </span>
        )}
      </button>
    );
  }

  // Authenticated user - show interactive button
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isVoting}
      className={clsx(
        'flex items-center gap-1 transition-colors',
        hasVoted
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-500 dark:text-gray-400 hover:text-red-500',
        isVoting && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {iconElement}
      {showCount && (
        <span>
          {voteCount} {likes}
        </span>
      )}
    </button>
  );
}

export default VoteButton;
