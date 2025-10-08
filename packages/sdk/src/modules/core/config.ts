import { Client } from "@hiveio/dhive";
import { MockStorage } from "./mock-storage";
import { QueryClient } from "@tanstack/react-query";

export const CONFIG = {
  privateApiHost: "https://ecency.com",
  storage:
    typeof window === "undefined" ? new MockStorage() : window.localStorage,
  storagePrefix: "ecency",
  hiveClient: new Client(
    [
      "https://api.hive.blog",
      "https://api.deathwing.me",
      "https://rpc.mahdiyari.info",
      "https://api.openhive.network",
      "https://techcoderx.com",
      "https://hive-api.arcange.eu",
      "https://api.syncad.com",
      "https://anyx.io",
      "https://api.c0ff33a.uk",
      "https://hiveapi.actifit.io",
      "https://hive-api.3speak.tv",
    ],
    {
      timeout: 2000,
      failoverThreshold: 2,
      consoleOnFailover: true,
    }
  ),
  heliusApiKey: process.env.VITE_HELIUS_API_KEY,
  queryClient: new QueryClient(),
  plausibleHost: "https://pl.ecency.com",
  spkNode: "https://spk.good-karma.xyz",
};

export namespace ConfigManager {
  export function setQueryClient(client: QueryClient) {
    CONFIG.queryClient = client;
  }
}
