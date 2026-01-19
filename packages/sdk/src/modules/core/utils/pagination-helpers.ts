import { WrappedResponse } from "../types/pagination";

/**
 * Type guard to check if response is wrapped with pagination metadata
 */
export function isWrappedResponse<T>(response: any): response is WrappedResponse<T> {
  return (
    response &&
    typeof response === "object" &&
    "data" in response &&
    "pagination" in response &&
    Array.isArray(response.data)
  );
}

/**
 * Normalize response to wrapped format for backwards compatibility
 * If the backend returns old format (array), convert it to wrapped format
 */
export function normalizeToWrappedResponse<T>(
  response: T[] | WrappedResponse<T>,
  limit: number
): WrappedResponse<T> {
  if (isWrappedResponse<T>(response)) {
    return response;
  }

  // Old format - just an array
  // Since we don't have pagination metadata, assume no more pages
  return {
    data: Array.isArray(response) ? response : [],
    pagination: {
      total: Array.isArray(response) ? response.length : 0,
      limit,
      offset: 0,
      has_next: false,
    },
  };
}
