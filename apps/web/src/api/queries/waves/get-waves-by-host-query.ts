import { getInfiniteQueryData } from "@/core/react-query";
import { getWavesByHostQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";

// Page = array of WaveEntry; Cursor = WaveEntry (container) or undefined
type WavesPage = any[];
type WavesCursor = any | undefined;

export const getWavesByHostQuery = (host: string) => {
  const options = getWavesByHostQueryOptions(host);
  const cached = getInfiniteQueryData<WavesPage, WavesCursor>({ queryKey: options.queryKey });

  const queryOptions = {
    ...options,
    placeholderData: () => cached,
    refetchOnMount: cached ? ("always" as const) : true,
  };

  return {
    ...queryOptions,
    useClientQuery: () => useInfiniteQuery(queryOptions),
  };
};
