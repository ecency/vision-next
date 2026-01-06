import { InfiniteData } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Use this hook for converting InfiniteData to one single stream of data
 * @param data
 */
export function useInfiniteDataFlow<T>(data: InfiniteData<T[]> | undefined) {
  return useMemo(() => data?.pages?.reduce((acc, p) => [...acc, ...p], []) ?? [], [data?.pages]);
}
