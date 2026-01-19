/**
 * Common size variants used across UI components
 */
export type Size = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Base props that most interactive components accept
 */
export interface BaseInteractiveProps {
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
export interface LoadingProps {
  /** Whether component is in loading state */
  isLoading?: boolean;
  /** Custom loading text */
  loadingText?: string;
}

/**
 * Vote data structure used across Hive blockchain
 */
export interface Vote {
  voter: string;
  weight?: number;
  percent?: number;
  rshares?: string | number;
}

/**
 * Auth context that components can use for authentication state
 */
export interface AuthContext {
  /** Current authenticated user */
  user: { username: string } | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Function to broadcast operations to blockchain */
  broadcast?: (operations: unknown[]) => Promise<void>;
}

/**
 * Configuration for image proxy
 */
export interface ImageProxyConfig {
  /** Base URL for image proxy (e.g., https://images.ecency.com) */
  baseUrl: string;
  /** Whether to use WebP format when supported */
  useWebp?: boolean;
}
