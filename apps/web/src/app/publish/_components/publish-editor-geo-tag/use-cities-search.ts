"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { buildCityIndex, searchCities } from "./geo-search";
import { CitiesDataset, GeoSuggestion } from "./geo-tag-types";

/**
 * Loads the compact, code-split cities dataset (fetched once, cached forever)
 * and exposes an instant offline search. The dataset lives in /public so it
 * stays out of the JS bundle and is served straight from the CDN/SW cache.
 */
export function useCitiesSearch(citiesUrl: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["geo-tag", "cities", citiesUrl],
    queryFn: async ({ signal }) => {
      const res = await fetch(citiesUrl, { signal });
      if (!res.ok) {
        throw new Error(`Failed to load cities dataset (${res.status})`);
      }
      return (await res.json()) as CitiesDataset;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1
  });

  const index = useMemo(() => (data ? buildCityIndex(data) : null), [data]);

  return useMemo(
    () => ({
      isReady: !!index,
      isLoading,
      isError,
      search: (query: string, limit = 6): GeoSuggestion[] =>
        index ? searchCities(index, query, limit) : []
    }),
    [index, isLoading, isError]
  );
}
