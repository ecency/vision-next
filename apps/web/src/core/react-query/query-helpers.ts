import { getQueryClient } from "./index";
import {
  useQuery,
  useInfiniteQuery,
  UseQueryOptions,
  UseInfiniteQueryOptions,
  InfiniteData
} from "@tanstack/react-query";
import { EcencyConfigManager } from "@/config";

/**
 * Prefetch a query on the server and return cached data.
 * Replaces the old `.prefetch()` method from EcencyQueriesManager.
 *
 * @example
 * // Server Component
 * const entry = await prefetchQuery(getPostQueryOptions(author, permlink));
 */
export async function prefetchQuery<T>(options: UseQueryOptions<T>) {
  const qc = getQueryClient();
  await qc.prefetchQuery(options as any);
  return qc.getQueryData<T>(options.queryKey!);
}

/**
 * Prefetch an infinite query on the server and return cached data.
 * Replaces the old `.prefetch()` method for infinite queries.
 *
 * @example
 * // Server Component
 * const posts = await prefetchInfiniteQuery(getAccountPostsInfiniteQueryOptions(username));
 */
export async function prefetchInfiniteQuery<TPage, TCursor>(
  options: UseInfiniteQueryOptions<TPage, Error, TPage, readonly unknown[], TCursor>
) {
  const qc = getQueryClient();
  await qc.prefetchInfiniteQuery(options as any);
  return qc.getQueryData<InfiniteData<TPage, TCursor>>(options.queryKey!);
}

/**
 * Get cached query data synchronously.
 * Replaces the old `.getData()` method from EcencyQueriesManager.
 *
 * @example
 * // Server or Client Component
 * const entry = getQueryData(getPostQueryOptions(author, permlink));
 */
export function getQueryData<T>(options: Pick<UseQueryOptions<T>, "queryKey">) {
  return getQueryClient().getQueryData<T>(options.queryKey!);
}

/**
 * Get cached infinite query data synchronously.
 * Replaces the old `.getData()` method for infinite queries.
 *
 * @example
 * // Server or Client Component
 * const posts = getInfiniteQueryData(getAccountPostsInfiniteQueryOptions(username));
 */
export function getInfiniteQueryData<TPage, TCursor>(
  options: Pick<UseInfiniteQueryOptions<TPage>, "queryKey">
) {
  return getQueryClient().getQueryData<InfiniteData<TPage, TCursor>>(options.queryKey!);
}

/**
 * Apply feature flag gating to query options.
 * Replaces the old `generateConfiguredClientServerQuery` method.
 *
 * @example
 * export const getPointsQuery = (username?: string) =>
 *   withFeatureFlag(
 *     ({ visionFeatures }) => visionFeatures.points.enabled,
 *     getPointsQueryOptions(username)
 *   );
 */
export function withFeatureFlag<
  T extends UseQueryOptions<any> | UseInfiniteQueryOptions<any>
>(condition: EcencyConfigManager.ConfigBasedCondition, options: T): T {
  return {
    ...options,
    enabled: (options.enabled ?? true) && condition(EcencyConfigManager.CONFIG)
  };
}
