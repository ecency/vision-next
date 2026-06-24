import { queryOptions } from "@tanstack/react-query";
import { ConfigManager, QueryKeys } from "@/modules/core";
import { WaveTrendingTag } from "../types";

interface WavesTrendingTagResponse {
  tag: string;
  posts: number;
}

export function getWavesTrendingTagsQueryOptions(host?: string, hours = 24) {
  // Omit the container for combined trending tags across all containers.
  const container = host?.trim() || undefined;

  return queryOptions({
    queryKey: QueryKeys.posts.wavesTrendingTags(container ?? "", hours),
    queryFn: async ({ signal }): Promise<WaveTrendingTag[]> => {
      try {
        const baseUrl = ConfigManager.getValidatedBaseUrl();
        const url = new URL("/private-api/waves/trending/tags", baseUrl);
        if (container) {
          url.searchParams.set("container", container);
        }
        url.searchParams.set("hours", hours.toString());

        const response = await fetch(url.toString(), {
          method: "GET",
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
