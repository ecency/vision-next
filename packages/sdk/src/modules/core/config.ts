import { Client } from "@hiveio/dhive";
import { QueryClient } from "@tanstack/react-query";

export const CONFIG = {
  privateApiHost: "https://ecency.com",
  imageHost: "https://images.ecency.com",
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
  // DMCA filtering - can be configured by the app
  dmcaAccounts: [] as string[],
  dmcaTags: [] as string[],
  dmcaPatterns: [] as string[],
  // Pre-compiled regex patterns for performance and security
  dmcaTagRegexes: [] as RegExp[],
  dmcaPatternRegexes: [] as RegExp[],
  // Track if DMCA has been initialized to avoid duplicate logs
  _dmcaInitialized: false,
};

export namespace ConfigManager {
  export function setQueryClient(client: QueryClient) {
    CONFIG.queryClient = client;
  }

  /**
   * Set the private API host
   * @param host - The private API host URL (e.g., "https://ecency.com" or "" for relative URLs)
   */
  export function setPrivateApiHost(host: string) {
    CONFIG.privateApiHost = host;
  }

  /**
   * Get a validated base URL for API requests
   * Returns a valid base URL that can be used with new URL(path, baseUrl)
   *
   * Priority:
   * 1. CONFIG.privateApiHost if set (dev/staging or explicit config)
   * 2. window.location.origin if in browser (production with relative URLs)
   * 3. 'https://ecency.com' as fallback for SSR (production default)
   *
   * @returns A valid base URL string
   * @throws Never throws - always returns a valid URL
   */
  export function getValidatedBaseUrl(): string {
    if (CONFIG.privateApiHost) {
      return CONFIG.privateApiHost;
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }

    // Fallback for SSR when privateApiHost is empty (production case)
    return 'https://ecency.com';
  }

  /**
   * Set the image host
   * @param host - The image host URL (e.g., "https://images.ecency.com")
   */
  export function setImageHost(host: string) {
    CONFIG.imageHost = host;
  }

  /**
   * Static analysis: Check for known ReDoS-vulnerable patterns
   * @param pattern - Raw regex pattern string
   * @returns Object with risk level and reason
   */
  function analyzeRedosRisk(pattern: string): { safe: boolean; reason?: string } {
    // Check 1: Nested quantifiers (e.g., (a+)+, (a*)+, (a{1,})+)
    if (/(\([^)]*[*+{][^)]*\))[*+{]/.test(pattern)) {
      return { safe: false, reason: "nested quantifiers detected" };
    }

    // Check 2: Alternation with overlapping terms (e.g., (a|a)+, (ab|a)+)
    if (/\([^|)]*\|[^)]*\)[*+{]/.test(pattern)) {
      return { safe: false, reason: "alternation with quantifier (potential overlap)" };
    }

    // Check 3: Catastrophic backtracking patterns (e.g., (a*)*b, (a+)+b)
    if (/\([^)]*[*+][^)]*\)[*+]/.test(pattern)) {
      return { safe: false, reason: "repeated quantifiers (catastrophic backtracking risk)" };
    }

    // Check 4: Greedy quantifiers followed by optional patterns (e.g., .*.*x, .+.+x)
    if (/\.\*\.\*/.test(pattern) || /\.\+\.\+/.test(pattern)) {
      return { safe: false, reason: "multiple greedy quantifiers on wildcards" };
    }

    // Check 5: Unbounded ranges with wildcards (e.g., .{1,999999})
    const unboundedRange = /\.?\{(\d+),(\d+)\}/g;
    let match;
    while ((match = unboundedRange.exec(pattern)) !== null) {
      const [, min, max] = match;
      const range = parseInt(max, 10) - parseInt(min, 10);
      if (range > 1000) {
        return { safe: false, reason: `excessive range: {${min},${max}}` };
      }
    }

    return { safe: true };
  }

  /**
   * Runtime test: Execute regex against adversarial inputs with timeout
   * @param regex - Compiled regex
   * @returns Object indicating if regex passed runtime test
   */
  function testRegexPerformance(regex: RegExp): { safe: boolean; reason?: string } {
    // Test inputs designed to trigger ReDoS in vulnerable patterns
    const adversarialInputs = [
      // Nested quantifier attack
      "a".repeat(50) + "x",
      // Alternation attack
      "ab".repeat(50) + "x",
      // Wildcard attack
      "x".repeat(100),
      // Mixed attack
      "aaa".repeat(30) + "bbb".repeat(30) + "x",
    ];

    const maxExecutionTime = 5; // 5ms hard limit per test

    for (const input of adversarialInputs) {
      const start = Date.now();
      try {
        regex.test(input);
        const duration = Date.now() - start;

        if (duration > maxExecutionTime) {
          return {
            safe: false,
            reason: `runtime test exceeded ${maxExecutionTime}ms (took ${duration}ms on input length ${input.length})`
          };
        }
      } catch (err) {
        return { safe: false, reason: `runtime test threw error: ${err}` };
      }
    }

    return { safe: true };
  }

  /**
   * Safely compile a regex pattern with defense-in-depth validation
   * @param pattern - Raw regex pattern string
   * @param maxLength - Maximum allowed pattern length (default 200)
   * @returns Compiled RegExp or null if invalid/unsafe
   */
  function safeCompileRegex(pattern: string, maxLength = 200): RegExp | null {
    const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

    try {
      // Layer 1: Basic validation
      if (!pattern) {
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: empty pattern`);
        }
        return null;
      }

      if (pattern.length > maxLength) {
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: length ${pattern.length} exceeds max ${maxLength} - pattern: ${pattern.substring(0, 50)}...`);
        }
        return null;
      }

      // Layer 2: Static ReDoS analysis
      const staticAnalysis = analyzeRedosRisk(pattern);
      if (!staticAnalysis.safe) {
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: static analysis failed (${staticAnalysis.reason}) - pattern: ${pattern.substring(0, 50)}...`);
        }
        return null;
      }

      // Layer 3: Compilation attempt
      let regex: RegExp;
      try {
        regex = new RegExp(pattern);
      } catch (compileErr) {
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: compilation failed - pattern: ${pattern.substring(0, 50)}...`, compileErr);
        }
        return null;
      }

      // Layer 4: Runtime performance testing
      const runtimeTest = testRegexPerformance(regex);
      if (!runtimeTest.safe) {
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: runtime test failed (${runtimeTest.reason}) - pattern: ${pattern.substring(0, 50)}...`);
        }
        return null;
      }

      return regex;
    } catch (err) {
      if (isDevelopment) {
        console.warn(`[SDK] DMCA pattern rejected: unexpected error - pattern: ${pattern.substring(0, 50)}...`, err);
      }
      return null;
    }
  }

  /**
   * Set DMCA filtering lists
   * @param accounts - List of account usernames to filter (plain strings)
   * @param tags - List of tag patterns (regex strings) to filter
   * @param patterns - List of post patterns (plain strings) like "@author/permlink" for exact matching
   */
  export function setDmcaLists(
    accounts: string[] = [],
    tags: string[] = [],
    patterns: string[] = []
  ) {
    CONFIG.dmcaAccounts = accounts;
    CONFIG.dmcaTags = tags;
    CONFIG.dmcaPatterns = patterns;

    // Pre-compile tag regex patterns (tags can be regex)
    CONFIG.dmcaTagRegexes = tags
      .map((pattern) => safeCompileRegex(pattern))
      .filter((r): r is RegExp => r !== null);

    // Post patterns are plain strings for exact matching, not regex
    // No compilation needed - they will be used with simple string comparison
    CONFIG.dmcaPatternRegexes = [];

    const rejectedTagCount = tags.length - CONFIG.dmcaTagRegexes.length;

    // Only log once to avoid noise during builds/hot reloads
    // Only show in development mode to avoid cluttering production console
    const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

    if (!CONFIG._dmcaInitialized && isDevelopment) {
      console.log(`[SDK] DMCA configuration loaded:`);
      console.log(`  - Accounts: ${accounts.length}`);
      console.log(`  - Tag patterns: ${CONFIG.dmcaTagRegexes.length}/${tags.length} compiled (${rejectedTagCount} rejected)`);
      console.log(`  - Post patterns: ${patterns.length} (using exact string matching)`);

      if (rejectedTagCount > 0) {
        console.warn(`[SDK] ${rejectedTagCount} DMCA tag patterns were rejected due to security validation. Check warnings above for details.`);
      }
    }

    CONFIG._dmcaInitialized = true;
  }
}
