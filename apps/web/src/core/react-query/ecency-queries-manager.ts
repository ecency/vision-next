import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useQuery,
  UseQueryOptions
} from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query/index";
import { EcencyConfigManager } from "@/config";

export namespace EcencyQueriesManager {
  export function getQueryData<T>(queryKey: QueryKey) {
    const queryClient = getQueryClient();
    return queryClient.getQueryData<T>(queryKey);
  }

  export function getInfiniteQueryData<T>(queryKey: QueryKey) {
    const queryClient = getQueryClient();
    return queryClient.getQueryData<InfiniteData<T>>(queryKey);
  }

  export async function prefetchQuery<T>(options: UseQueryOptions<T>) {
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(options);
    return getQueryData<T>(options.queryKey);
  }

  export async function prefetchInfiniteQuery<T, P>(
    options: UseInfiniteQueryOptions<T, Error, InfiniteData<T>, T, QueryKey, P>
  ) {
    const queryClient = getQueryClient();
    await queryClient.prefetchInfiniteQuery(options);
    return getInfiniteQueryData<T>(options.queryKey);
  }

  export function generateClientServerQuery<T>(options: UseQueryOptions<T>) {
    return {
      prefetch: () => prefetchQuery(options),
      getData: () => getQueryData<T>(options.queryKey),
      useClientQuery: () => useQuery(options),
      fetchAndGet: () => getQueryClient().fetchQuery(options)
    };
  }

  export function generateClientServerInfiniteQuery<T, P>(
    options: UseInfiniteQueryOptions<T, Error, InfiniteData<T>, T, QueryKey, P>
  ) {
    return {
      prefetch: () => prefetchInfiniteQuery(options),
      getData: () => getInfiniteQueryData<T>(options.queryKey),
      useClientQuery: () => useInfiniteQuery(options),
      fetchAndGet: () => getQueryClient().fetchInfiniteQuery(options)
    };
  }

  export function generateConfiguredClientServerQuery<T>(
    condition: EcencyConfigManager.ConfigBasedCondition,
    options: UseQueryOptions<T>
  ) {
    return generateClientServerQuery({
      ...options,
      enabled: options && condition(EcencyConfigManager.CONFIG)
    });
  }

  export function generateConfiguredClientServerInfiniteQuery<T, P>(
    condition: EcencyConfigManager.ConfigBasedCondition,
    options: UseInfiniteQueryOptions<T, Error, InfiniteData<T>, T, QueryKey, P>
  ) {
    return generateClientServerInfiniteQuery({
      ...options,
      enabled: options && condition(EcencyConfigManager.CONFIG)
    });
  }
}
