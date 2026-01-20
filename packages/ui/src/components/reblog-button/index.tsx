'use client';

import { clsx } from 'clsx';
import { useCallback, useMemo, useState } from 'react';

export interface ReblogButtonProps {
  /** Post author username */
  author: string;
  /** Post permlink */
  permlink: string;
  /** Current reblog count */
  reblogCount?: number;
  /** Current user's username (null if not logged in) */
  currentUser?: string | null;
  /** Whether reblogging is enabled */
  isReblogEnabled?: boolean;
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  /** Callback to handle reblog action */
  onReblog?: (params: { author: string; permlink: string }) => Promise<void>;
  /** Custom confirmation function (return true to proceed) */
  onConfirm?: () => boolean | Promise<boolean>;
  /** Additional CSS classes */
  className?: string;
  /** Custom labels */
  labels?: {
    reblogs?: string;
    reblogging?: string;
    confirmMessage?: string;
    loginTitle?: string;
    ownPostTitle?: string;
    rebloggedTitle?: string;
    reblogTitle?: string;
  };
  /** Custom icon component */
  icon?: React.ReactNode;
}

/**
 * Default reblog/share icon
 */
function ReblogIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
      />
    </svg>
  );
}

/**
 * ReblogButton allows users to reblog/share content on the Hive blockchain.
 *
 * Features:
 * - Shows current reblog count
 * - Prevents reblogging own posts
 * - Tracks reblog state within session
 * - Customizable confirmation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ReblogButton
 *   author="ecency"
 *   permlink="my-post"
 *   reblogCount={5}
 *   currentUser="myuser"
 *   isAuthenticated={true}
 *   onReblog={async ({ author, permlink }) => {
 *     await broadcastReblog(author, permlink);
 *   }}
 * />
 * ```
 */
export function ReblogButton({
  author,
  permlink,
  reblogCount = 0,
  currentUser,
  isReblogEnabled = true,
  isAuthenticated = false,
  onReblog,
  onConfirm,
  className,
  labels = {},
  icon,
}: ReblogButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReblogged, setHasReblogged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    reblogs = 'reblogs',
    reblogging = 'Reblogging...',
    confirmMessage = 'Are you sure you want to reblog this post to your followers?',
    loginTitle = 'Login to reblog',
    ownPostTitle = "You can't reblog your own post",
    rebloggedTitle = 'Already reblogged',
    reblogTitle = 'Reblog to your followers',
  } = labels;

  // Can't reblog your own post
  const isOwnPost = currentUser?.toLowerCase() === author.toLowerCase();

  const handleReblog = useCallback(async () => {
    if (!currentUser || isSubmitting || isOwnPost || hasReblogged || !onReblog) return;

    // Confirmation
    const defaultConfirm = () => window.confirm(confirmMessage);
    const confirmed = onConfirm ? await onConfirm() : defaultConfirm();
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onReblog({ author, permlink });
      setHasReblogged(true);
    } catch (err) {
      console.error('Reblog failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to reblog');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentUser,
    isSubmitting,
    isOwnPost,
    hasReblogged,
    onReblog,
    author,
    permlink,
    confirmMessage,
    onConfirm,
  ]);

  const buttonLabel = useMemo(() => {
    if (isSubmitting) return reblogging;
    return `${reblogCount + (hasReblogged ? 1 : 0)} ${reblogs}`;
  }, [reblogCount, hasReblogged, isSubmitting, reblogging, reblogs]);

  const title = useMemo(() => {
    if (!isAuthenticated) return loginTitle;
    if (isOwnPost) return ownPostTitle;
    if (hasReblogged) return rebloggedTitle;
    return reblogTitle;
  }, [isAuthenticated, isOwnPost, hasReblogged, loginTitle, ownPostTitle, rebloggedTitle, reblogTitle]);

  const iconElement = icon || <ReblogIcon className="w-4 h-4" />;

  // If reblogging is not enabled, show static count
  if (!isReblogEnabled) {
    return (
      <div
        className={clsx(
          'flex items-center gap-1 text-gray-500 dark:text-gray-400',
          className
        )}
      >
        {iconElement}
        <span>
          {reblogCount} {reblogs}
        </span>
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
              ? 'text-gray-500 dark:text-gray-400 hover:text-green-500 cursor-pointer'
              : 'text-gray-500 dark:text-gray-400 cursor-not-allowed'
        )}
        title={title}
      >
        {iconElement}
        <span>{buttonLabel}</span>
      </button>
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </div>
  );
}

export default ReblogButton;
