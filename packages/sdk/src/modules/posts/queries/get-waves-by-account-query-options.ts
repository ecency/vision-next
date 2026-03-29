import { infiniteQueryOptions } from "@tanstack/react-query";
import { ConfigManager, QueryKeys } from "@/modules/core";
import { Entry, WaveEntry } from "../types";
import { normalizeWaveEntryFromApi } from "../utils/waves-helpers";

interface WavesAccountEntry extends Entry {
  post_id: number;
  container?: (Entry & { post_id: number }) | null;
  parent?: (Entry & { post_id: number }) | null;
}

export function getWavesByAccountQueryOptions(host: string, username?: string) {
  const normalizedUsername = username?.trim().toLowerCase();

  return infiniteQueryOptions({
    queryKey: QueryKeys.posts.wavesByAccount(host, normalizedUsername ?? ""),
    enabled: Boolean(normalizedUsername),
    initialPageParam: undefined,

    queryFn: async ({ signal }) => {
      if (!normalizedUsername) {
        return [];
      }

      try {
        const baseUrl = ConfigManager.getValidatedBaseUrl();
        const url = new URL("/private-api/waves/account", baseUrl);
        url.searchParams.set("container", host);
        url.searchParams.set("username", normalizedUsername);

        const response = await fetch(url.toString(), {
          method: "GET",
          signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch waves for account: ${response.status}`);
        }

        const data = await response.json() as WavesAccountEntry[];

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
        console.error("[SDK] Failed to fetch waves for account", error);
        throw error;
      }
    },

    getNextPageParam: () => undefined,
  });
}
