import { ConfigManager } from "@ecency/sdk";
import { isServer, QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/**
 * Web-only query identifiers for features that have no SDK equivalent.
 * SDK-backed queries should use QueryKeys from @ecency/sdk instead.
 */
export enum QueryIdentifiers {
  COMMUNITY_THREADS = "community-threads",
  THREADS = "threads",
  ENTRY_THUMB = "entry-thumb",
  ENTRY_PIN_TRACK = "entry-pin-track",
  PROMOTED_ENTRIES = "promoted-entries",
  SWAP_FORM_CURRENCY_RATE = "swap-form-currency-rate",
  THREE_SPEAK_VIDEO_LIST = "three-speak-video-list",
  THREE_SPEAK_VIDEO_LIST_FILTERED = "three-speak-video-list-filtered",
  POLL_DETAILS = "poll-details",
  CONTRIBUTORS = "contributors",
  GIFS = "GIFS",
  MARKET_TRADING_VIEW = "market-trading-view",
  MARKET_BUCKET_SIZE = "market-bucket-size"
}

export function makeQueryClient() {
  // Cache creates one single instance per request in a server side
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 60 seconds - prevents immediate refetch after SSR prefetch
        gcTime: 10 * 60 * 1000, // 10 minutes - garbage collect unused cache entries
        refetchOnWindowFocus: false,
        refetchOnMount: false
      }
    }
  });
}

export const getQueryClient = isServer
  ? cache(() => makeQueryClient())
  : () => {
      if ((global as any).clientQueryClient) {
        ConfigManager.setQueryClient((global as any).clientQueryClient);
        return (global as any).clientQueryClient as QueryClient;
      }
      (global as any).clientQueryClient = makeQueryClient();

      ConfigManager.setQueryClient((global as any).clientQueryClient);
      return (global as any).clientQueryClient as QueryClient;
    };

export * from "./query-helpers";
