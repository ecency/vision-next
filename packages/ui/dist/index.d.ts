import * as react_jsx_runtime from 'react/jsx-runtime';

/**
 * Common size variants used across UI components
 */
type Size = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
/**
 * Base props that most interactive components accept
 */
interface BaseInteractiveProps {
    /** Additional CSS classes */
    className?: string;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Click handler */
    onClick?: () => void;
}
/**
 * Props for components that display loading states
 */
interface LoadingProps {
    /** Whether component is in loading state */
    isLoading?: boolean;
    /** Custom loading text */
    loadingText?: string;
}
/**
 * Vote data structure used across Hive blockchain
 */
interface Vote {
    voter: string;
    weight?: number;
    percent?: number;
    rshares?: string | number;
}
/**
 * Auth context that components can use for authentication state
 */
interface AuthContext {
    /** Current authenticated user */
    user: {
        username: string;
    } | null;
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** Function to broadcast operations to blockchain */
    broadcast?: (operations: unknown[]) => Promise<void>;
}
/**
 * Configuration for image proxy
 */
interface ImageProxyConfig {
    /** Base URL for image proxy (e.g., https://images.ecency.com) */
    baseUrl: string;
    /** Whether to use WebP format when supported */
    useWebp?: boolean;
}

interface UserAvatarProps {
    /** Hive username */
    username: string;
    /** Avatar size variant */
    size?: Size | 'normal' | 'sLarge' | 'xLarge' | 'deck-item';
    /** Custom image source (overrides default avatar URL) */
    src?: string;
    /** Base URL for image proxy (default: https://images.ecency.com) */
    imageProxyBase?: string;
    /** Click handler - makes avatar interactive */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * UserAvatar displays a Hive user's profile avatar image.
 *
 * Features:
 * - Automatic WebP detection and usage when supported
 * - Configurable image proxy
 * - Multiple size variants
 * - Accessible (keyboard navigation, ARIA labels)
 * - SSR-safe with hydration handling
 *
 * @example
 * ```tsx
 * // Basic usage
 * <UserAvatar username="ecency" />
 *
 * // With click handler
 * <UserAvatar username="ecency" size="large" onClick={() => navigate('/profile')} />
 *
 * // Custom proxy
 * <UserAvatar username="ecency" imageProxyBase="https://my-proxy.com" />
 * ```
 */
declare function UserAvatar({ username, size, src, imageProxyBase, onClick, className, }: UserAvatarProps): react_jsx_runtime.JSX.Element;

interface ErrorMessageProps {
    /** Error message to display */
    message?: string;
    /** Callback when retry button is clicked */
    onRetry?: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Custom retry button text (default: "Retry") */
    retryText?: string;
    /** Custom icon component */
    icon?: React.ReactNode;
}
/**
 * ErrorMessage displays an error state with optional retry functionality.
 *
 * Features:
 * - Customizable error message
 * - Optional retry button with callback
 * - Custom icon support
 * - Accessible design
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorMessage message="Failed to load data" />
 *
 * // With retry
 * <ErrorMessage
 *   message="Network error"
 *   onRetry={() => refetch()}
 *   retryText="Try again"
 * />
 *
 * // Custom icon
 * <ErrorMessage message="Error" icon={<CustomIcon />} />
 * ```
 */
declare function ErrorMessage({ message, onRetry, className, retryText, icon, }: ErrorMessageProps): react_jsx_runtime.JSX.Element;

interface VoteButtonProps {
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
    onVote?: (params: {
        author: string;
        permlink: string;
        weight: number;
    }) => Promise<void>;
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
declare function VoteButton({ author, permlink, activeVotes, currentUser, isVotingEnabled, isAuthenticated, onVote, onAuthRequired, showCount, className, labels, icon, }: VoteButtonProps): react_jsx_runtime.JSX.Element;

interface ReblogButtonProps {
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
    onReblog?: (params: {
        author: string;
        permlink: string;
    }) => Promise<void>;
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
declare function ReblogButton({ author, permlink, reblogCount, currentUser, isReblogEnabled, isAuthenticated, onReblog, onConfirm, className, labels, icon, }: ReblogButtonProps): react_jsx_runtime.JSX.Element;

interface SkeletonProps {
    /** Width of the skeleton (CSS value or Tailwind class) */
    width?: string;
    /** Height of the skeleton (CSS value or Tailwind class) */
    height?: string;
    /** Whether to use rounded corners */
    rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
    /** Additional CSS classes */
    className?: string;
    /** Number of skeleton items to render */
    count?: number;
}
/**
 * Skeleton displays a placeholder loading animation.
 *
 * Features:
 * - Customizable dimensions
 * - Multiple rounding options
 * - Can render multiple skeletons
 * - Animated pulse effect
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton width="w-full" height="h-4" />
 *
 * // Avatar skeleton
 * <Skeleton width="w-10" height="h-10" rounded="full" />
 *
 * // Multiple lines
 * <Skeleton width="w-full" height="h-4" count={3} />
 * ```
 */
declare function Skeleton({ width, height, rounded, className, count, }: SkeletonProps): react_jsx_runtime.JSX.Element;

interface SpinnerProps {
    /** Size of the spinner */
    size?: Size;
    /** Additional CSS classes */
    className?: string;
    /** Accessible label for screen readers */
    label?: string;
}
/**
 * Spinner displays a loading indicator animation.
 *
 * Features:
 * - Multiple size variants
 * - Accessible with customizable label
 * - CSS-based animation (no JS)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Spinner />
 *
 * // Large spinner with label
 * <Spinner size="large" label="Loading content..." />
 *
 * // Custom styling
 * <Spinner className="text-blue-500" />
 * ```
 */
declare function Spinner({ size, className, label, }: SpinnerProps): react_jsx_runtime.JSX.Element;

/**
 * Hook to track if the component has mounted on the client.
 * Useful for SSR/hydration scenarios where you need to render
 * differently on client vs server.
 *
 * @returns Whether the component has mounted
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasMounted = useMounted();
 *
 *   // Return placeholder during SSR
 *   if (!hasMounted) {
 *     return <div className="placeholder" />;
 *   }
 *
 *   // Render full content on client
 *   return <div>{window.location.href}</div>;
 * }
 * ```
 */
declare function useMounted(): boolean;

/**
 * Hook to detect WebP image format support in the browser.
 *
 * @returns Whether the browser supports WebP images
 *
 * @example
 * ```tsx
 * function MyImage({ src }: { src: string }) {
 *   const supportsWebp = useWebpSupport();
 *   const imageUrl = supportsWebp ? `${src}.webp` : `${src}.jpg`;
 *   return <img src={imageUrl} />;
 * }
 * ```
 */
declare function useWebpSupport(): boolean;

export { type AuthContext, type BaseInteractiveProps, ErrorMessage, type ErrorMessageProps, type ImageProxyConfig, type LoadingProps, ReblogButton, type ReblogButtonProps, type Size, Skeleton, type SkeletonProps, Spinner, type SpinnerProps, UserAvatar, type UserAvatarProps, type Vote, VoteButton, type VoteButtonProps, useMounted, useWebpSupport };
