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
      consoleOnFailover: true
    }
  ),
  heliusApiKey: process.env.VITE_HELIUS_API_KEY,
  queryClient: new QueryClient(),
  plausibleHost: "https://pl.ecency.com",
  spkNode: "https://spk.good-karma.xyz",
  // DMCA filtering - can be configured by the app
  dmcaAccounts: [] as string[],
  dmcaTags: [] as string[],
  dmcaPatterns: [] as string[],
  // Pre-compiled regex patterns for performance and security
  dmcaTagRegexes: [] as RegExp[],
  dmcaPatternRegexes: [] as RegExp[],
};

export namespace ConfigManager {
  export function setQueryClient(client: QueryClient) {
    CONFIG.queryClient = client;
  }

  /**
   * Safely compile a regex pattern with validation
   * @param pattern - Raw regex pattern string
   * @param maxLength - Maximum allowed pattern length (default 500)
   * @returns Compiled RegExp or null if invalid
   */
  function safeCompileRegex(pattern: string, maxLength = 500): RegExp | null {
    try {
      // Validate pattern length to prevent ReDoS
      if (!pattern || pattern.length > maxLength) {
        console.warn(`[SDK] DMCA pattern too long or empty: ${pattern.substring(0, 50)}...`);
        return null;
      }

      // Validate pattern doesn't contain excessive nested quantifiers (basic check)
      const nestedQuantifiers = /(\*|\+|\{.*\}){2,}/;
      if (nestedQuantifiers.test(pattern)) {
        console.warn(`[SDK] DMCA pattern contains nested quantifiers (ReDoS risk): ${pattern.substring(0, 50)}...`);
        return null;
      }

      // Compile the regex
      const regex = new RegExp(pattern);

      // Test the regex with a simple string to ensure it doesn't hang
      const testStart = Date.now();
      regex.test("test");
      const testDuration = Date.now() - testStart;

      if (testDuration > 10) {
        console.warn(`[SDK] DMCA pattern too slow (${testDuration}ms): ${pattern.substring(0, 50)}...`);
        return null;
      }

      return regex;
    } catch (err) {
      console.warn(`[SDK] Invalid DMCA regex pattern: ${pattern}`, err);
      return null;
    }
  }

  /**
   * Set DMCA filtering lists
   * @param accounts - List of account usernames to filter
   * @param tags - List of tag patterns (regex strings) to filter
   * @param patterns - List of post patterns (regex strings) like "@author/permlink" to filter
   */
  export function setDmcaLists(
    accounts: string[] = [],
    tags: string[] = [],
    patterns: string[] = []
  ) {
    CONFIG.dmcaAccounts = accounts;
    CONFIG.dmcaTags = tags;
    CONFIG.dmcaPatterns = patterns;

    // Pre-compile tag regex patterns
    CONFIG.dmcaTagRegexes = tags
      .map(safeCompileRegex)
      .filter((r): r is RegExp => r !== null);

    // Pre-compile pattern regex patterns
    CONFIG.dmcaPatternRegexes = patterns
      .map(safeCompileRegex)
      .filter((r): r is RegExp => r !== null);

    console.log(`[SDK] Compiled ${CONFIG.dmcaTagRegexes.length}/${tags.length} tag patterns`);
    console.log(`[SDK] Compiled ${CONFIG.dmcaPatternRegexes.length}/${patterns.length} post patterns`);
  }
}
