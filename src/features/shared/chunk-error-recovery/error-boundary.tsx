"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree,
 * particularly useful for catching errors that occur after chunk loading failures
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Check if this error is related to chunk loading or DOM manipulation after chunk failure
    const isChunkRelated = 
      error.name === "ChunkLoadError" ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("parentNode") ||
      error.message?.includes("Cannot read properties of null");

    if (isChunkRelated) {
      console.error("Chunk-related error detected in ErrorBoundary:", error);
      
      // For chunk-related errors, attempt a page reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Check if we have a custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            An unexpected error occurred. The page will refresh automatically.
          </p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}