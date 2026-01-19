/**
 * Generic pagination metadata for wrapped API responses
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
}

/**
 * Generic wrapped response with pagination metadata
 */
export interface WrappedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
