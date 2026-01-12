import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { Entry, WaveEntry } from "../types";
import { normalizeWaveEntryFromApi } from "../utils/waves-helpers";

type WavesFollowingEntry = Entry & {
  post_id: number;
  container?: (Entry & { post_id: number }) | null;
  parent?: (Entry & { post_id: number }) | null;
};

export function getWavesFollowingQueryOptions(host: string, username?: string) {
  const normalizedUsername = username?.trim().toLowerCase();

  return infiniteQueryOptions({
    queryKey: ["posts", "waves", "following", host, normalizedUsername ?? ""],
    enabled: Boolean(normalizedUsername),
    initialPageParam: undefined,

    queryFn: async ({ signal }) => {
      if (!normalizedUsername) {
        return [];
      }

      try {
        const baseUrl = CONFIG.privateApiHost || (typeof window !== 'undefined' ? window.location.origin : '');
        const url = new URL("/private-api/waves/following", baseUrl);
        url.searchParams.set("container", host);
        url.searchParams.set("username", normalizedUsername);

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch waves following feed: ${response.status}`);
        }

        const data = await response.json() as WavesFollowingEntry[];

        if (!Array.isArray(data) || data.length === 0) {
          return [];
        }

        const flattened = data
          .map((entry) => normalizeWaveEntryFromApi(entry, host))
          .filter((entry): entry is WaveEntry => Boolean(entry));

        if (flattened.length === 0) {
          return [];
        }

        return flattened.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );
      } catch (error) {
        console.error("[SDK] Failed to fetch waves following feed", error);
        return [];
      }
    },

    getNextPageParam: () => undefined
  });
}
