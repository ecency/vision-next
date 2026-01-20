'use client';

import { clsx } from 'clsx';

export interface ErrorMessageProps {
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
 * Default error icon (exclamation triangle)
 */
function DefaultErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
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
export function ErrorMessage({
  message = 'An error occurred',
  onRetry,
  className,
  retryText = 'Retry',
  icon,
}: ErrorMessageProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-12 px-4',
        className
      )}
      role="alert"
    >
      {icon || <DefaultErrorIcon className="w-12 h-12 text-red-500 mb-4" />}
      <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
        >
          {retryText}
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
