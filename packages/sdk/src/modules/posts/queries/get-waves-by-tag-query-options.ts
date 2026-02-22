import { infiniteQueryOptions } from "@tanstack/react-query";
import { ConfigManager, QueryKeys } from "@/modules/core";
import { Entry, WaveEntry } from "../types";
import { normalizeWaveEntryFromApi } from "../utils/waves-helpers";

type WavesTagEntryResponse = Entry & {
  post_id: number;
  container?: (Entry & { post_id: number }) | null;
  parent?: (Entry & { post_id: number }) | null;
};

const DEFAULT_TAG_FEED_LIMIT = 40;

export function getWavesByTagQueryOptions(host: string, tag: string, limit = DEFAULT_TAG_FEED_LIMIT) {
  return infiniteQueryOptions({
    queryKey: QueryKeys.posts.wavesByTag(host, tag),
    initialPageParam: undefined,

    queryFn: async ({ signal }) => {
      try {
        const baseUrl = ConfigManager.getValidatedBaseUrl();
        const url = new URL("/private-api/waves/tags", baseUrl);
        url.searchParams.set("container", host);
        url.searchParams.set("tag", tag);

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch waves by tag: ${response.status}`);
        }

        const data = await response.json() as WavesTagEntryResponse[];

        const result = data
          .slice(0, limit)
          .map((entry) => normalizeWaveEntryFromApi(entry, host))
          .filter((entry): entry is WaveEntry => Boolean(entry));

        return result.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );
      } catch (error) {
        console.error("[SDK] Failed to fetch waves by tag", error);
        return [];
      }
    },

    getNextPageParam: () => undefined
  });
}
