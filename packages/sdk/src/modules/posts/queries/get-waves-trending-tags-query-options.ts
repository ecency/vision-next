import { queryOptions } from "@tanstack/react-query";
import { ConfigManager, QueryKeys } from "@/modules/core";
import { WaveTrendingTag } from "../types";

interface WavesTrendingTagResponse {
  tag: string;
  posts: number;
}

export function getWavesTrendingTagsQueryOptions(host: string, hours = 24) {
  return queryOptions({
    queryKey: QueryKeys.posts.wavesTrendingTags(host, hours),
    queryFn: async ({ signal }): Promise<WaveTrendingTag[]> => {
      try {
        const baseUrl = ConfigManager.getValidatedBaseUrl();
        const url = new URL("/private-api/waves/trending/tags", baseUrl);
        url.searchParams.set("container", host);
        url.searchParams.set("hours", hours.toString());

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch waves trending tags: ${response.status}`);
        }

        const data = await response.json() as WavesTrendingTagResponse[];

        return data.map(({ tag, posts }) => ({ tag, posts }));
      } catch (error) {
        console.error("[SDK] Failed to fetch waves trending tags", error);
        return [];
      }
    }
  });
}
