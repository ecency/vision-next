import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useQuery,
  UseQueryOptions,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query/index";
import { EcencyConfigManager } from "@/config";

export namespace EcencyQueriesManager {
  // ---------- Basic getters ----------
  export function getQueryData<T>(queryKey: QueryKey) {
    return getQueryClient().getQueryData<T>(queryKey);
  }

  export function getInfiniteQueryData<TPage, TCursor>(queryKey: QueryKey) {
    return getQueryClient().getQueryData<InfiniteData<TPage, TCursor>>(queryKey);
  }

  // ---------- Prefetch ----------
  export async function prefetchQuery<T>(options: UseQueryOptions<T>) {
    const qc = getQueryClient();
    await qc.prefetchQuery(options as any);
    return qc.getQueryData<T>(options.queryKey!);
  }

  // TanStack v5: UseInfiniteQueryOptions<
  //   TQueryFnData, TError, TData, TQueryKey, TPageParam
  // >
  type InfiniteOpts<TPage, TCursor> =
      UseInfiniteQueryOptions<TPage, Error, TPage, readonly unknown[], TCursor>;

  export async function prefetchInfiniteQuery<TPage, TCursor>(
      options: InfiniteOpts<TPage, TCursor>
  ) {
    const qc = getQueryClient();
    await qc.prefetchInfiniteQuery(options as any);
    return qc.getQueryData<InfiniteData<TPage, TCursor>>(options.queryKey!);
  }

  // ---------- Client/Server query wrappers ----------
  export function generateClientServerQuery<T>(options: UseQueryOptions<T>) {
    const qc = getQueryClient();
    return {
      prefetch: () => prefetchQuery(options),
      getData: () => qc.getQueryData<T>(options.queryKey!),
      useClientQuery: () => useQuery(options as any),
      fetchAndGet: () => qc.fetchQuery(options as any),
    };
  }

  export function generateClientServerInfiniteQuery<TPage, TCursor>(
      options: InfiniteOpts<TPage, TCursor>
  ) {
    const qc = getQueryClient();
    return {
      prefetch: () => prefetchInfiniteQuery<TPage, TCursor>(options),
      getData: () => qc.getQueryData<InfiniteData<TPage, TCursor>>(options.queryKey!),
      useClientQuery: (
          overrides?: Partial<InfiniteOpts<TPage, TCursor>>
      ): UseInfiniteQueryResult<TPage, Error> =>
          useInfiniteQuery<TPage, Error, TPage, readonly unknown[], TCursor>({
            ...(options as any),
            ...(overrides as any),
          }),
      fetchAndGet: () => qc.fetchInfiniteQuery(options as any),
    };
  }

  // ---------- Config-gated wrappers ----------
  export function generateConfiguredClientServerQuery<T>(
      condition: EcencyConfigManager.ConfigBasedCondition,
      options: UseQueryOptions<T>
  ) {
    return generateClientServerQuery({
      ...options,
      enabled: (options.enabled ?? true) && condition(EcencyConfigManager.CONFIG),
    });
  }

  export function generateConfiguredClientServerInfiniteQuery<TPage, TCursor>(
      condition: EcencyConfigManager.ConfigBasedCondition,
      options: InfiniteOpts<TPage, TCursor>
  ) {
    return generateClientServerInfiniteQuery<TPage, TCursor>({
      ...options,
      enabled: (options.enabled ?? true) && condition(EcencyConfigManager.CONFIG),
    });
  }
}
