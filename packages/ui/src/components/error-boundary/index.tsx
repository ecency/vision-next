'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { ErrorMessage } from '../error-message';

export interface ErrorBoundaryProps {
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
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage =
        this.props.errorMessage ||
        this.state.error?.message ||
        'Something went wrong';

      return (
        <div
          className={clsx(
            'flex items-center justify-center min-h-[200px] p-4',
            this.props.className
          )}
        >
          <ErrorMessage
            message={errorMessage}
            onRetry={this.handleRetry}
            retryText={this.props.retryText}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
