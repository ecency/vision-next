import { queryOptions } from "@tanstack/react-query";
import { ConfigManager, QueryKeys } from "@/modules/core";
import { WaveTrendingAuthor } from "../types";

export function getWavesTrendingAuthorsQueryOptions(host: string) {
  return queryOptions({
    queryKey: QueryKeys.posts.wavesTrendingAuthors(host),
    queryFn: async ({ signal }): Promise<WaveTrendingAuthor[]> => {
      try {
        const baseUrl = ConfigManager.getValidatedBaseUrl();
        const url = new URL("/private-api/waves/trending/authors", baseUrl);
        url.searchParams.set("container", host);

        const response = await fetch(url.toString(), {
          method: "GET",
          signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch waves trending authors: ${response.status}`);
        }

        const data = await response.json() as WaveTrendingAuthor[];

        return data.map(({ author, posts }) => ({ author, posts }));
      } catch (error) {
        console.error("[SDK] Failed to fetch waves trending authors", error);
        throw error;
      }
    },
  });
}
