import * as react_jsx_runtime from 'react/jsx-runtime';
import { Component, ReactNode, ErrorInfo } from 'react';

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

interface ErrorBoundaryProps {
    /** Child components to render */
    children: ReactNode;
    /** Optional fallback UI to render instead of the default ErrorMessage */
    fallback?: ReactNode;
    /** Called when an error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Additional CSS classes for the error container */
    className?: string;
    /** Custom error message (default: error.message or "Something went wrong") */
    errorMessage?: string;
    /** Custom retry button text */
    retryText?: string;
}
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}
/**
 * ErrorBoundary catches JavaScript errors anywhere in its child component tree
 * and displays a fallback UI instead of crashing the whole app.
 *
 * Features:
 * - Catches render errors in child components
 * - Displays customizable fallback UI
 * - Optional error callback for logging/reporting
 * - Retry functionality to attempt re-rendering
 * - Accessible error display
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With error logging
 * <ErrorBoundary onError={(error, info) => logError(error, info)}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    handleRetry: () => void;
    render(): string | number | boolean | react_jsx_runtime.JSX.Element | Iterable<ReactNode> | null | undefined;
}

interface SkipToContentProps {
    /** Target element ID to skip to (default: "main-content") */
    targetId?: string;
    /** Link text (default: "Skip to main content") */
    children?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * SkipToContent provides a keyboard-accessible link that allows users to
 * skip past navigation and go directly to main content.
 *
 * The link is visually hidden but becomes visible when focused,
 * following WCAG 2.1 accessibility guidelines.
 *
 * Features:
 * - Visually hidden until focused
 * - Keyboard accessible (Tab to reveal)
 * - Customizable target and text
 * - High contrast focus state
 *
 * @example
 * ```tsx
 * // Basic usage - add at the beginning of your layout
 * // Ensure main content has id="main-content"
 * <SkipToContent />
 * <Navigation />
 * <main id="main-content">...</main>
 *
 * // Custom target
 * <SkipToContent targetId="article-content">
 *   Skip to article
 * </SkipToContent>
 * ```
 */
declare function SkipToContent({ targetId, children, className, }: SkipToContentProps): react_jsx_runtime.JSX.Element;

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

export { type AuthContext, type BaseInteractiveProps, ErrorBoundary, type ErrorBoundaryProps, ErrorMessage, type ErrorMessageProps, type ImageProxyConfig, type LoadingProps, ReblogButton, type ReblogButtonProps, type Size, Skeleton, type SkeletonProps, SkipToContent, type SkipToContentProps, Spinner, type SpinnerProps, UserAvatar, type UserAvatarProps, type Vote, VoteButton, type VoteButtonProps, useMounted, useWebpSupport };
