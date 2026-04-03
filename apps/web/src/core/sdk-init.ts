/**
 * SDK Initialization - runs immediately when imported
 *
 * This file configures the SDK with DMCA filtering lists before any queries execute.
 * It must be imported early in both client and server entry points to ensure
 * the DMCA lists are available from the first render.
 */

import { ConfigManager } from "@ecency/sdk";
import defaults from "@/defaults";
import dmcaAccounts from "../../public/dmca/dmca-accounts.json";
import dmcaTags from "../../public/dmca/dmca-tags.json";
import dmcaPosts from "../../public/dmca/dmca-posts.json";
import publicNodes from "../../public/public-nodes.json";

// Configure SDK API host based on environment.
//
// Client-side (browser on ecency.com): empty string for relative URLs
// Server-side (SSR): use INTERNAL_API_HOST if set (Docker internal route to vapi,
//   skips Cloudflare round-trip) or fall back to public URL
// Client-side (non-production): absolute public URL
const isMainProductionClient =
  typeof window !== "undefined" &&
  (window.location.hostname === "ecency.com" || window.location.hostname.endsWith(".ecency.com"));

const isServer = typeof window === "undefined";
const privateApiHost = isMainProductionClient
  ? ""
  : isServer
    ? (process.env.INTERNAL_API_HOST || "https://ecency.com")
    : "https://ecency.com";
ConfigManager.setPrivateApiHost(privateApiHost);
ConfigManager.setImageHost(defaults.imageServer);
ConfigManager.setHiveNodes(publicNodes);

// Initialize DMCA filtering immediately at module load time
// This ensures the lists are available before any React Query fetches execute
// Files are in public/dmca/ for both bundling and mobile app access
ConfigManager.setDmcaLists({
  accounts: dmcaAccounts.accounts ?? [],
  tags: dmcaTags.tags ?? [],
  posts: dmcaPosts.posts ?? [],
});

// NOTE: Web broadcast adapter is NOT initialized here.
// Mutation hooks should retrieve and pass the shared web adapter singleton
// when calling SDK mutations.
//
// Example usage in a hook:
// ```typescript
// import { useVote } from '@ecency/sdk';
// import { getWebBroadcastAdapter } from '@/providers/sdk';
//
// export function useVoteMutation() {
//   const currentUser = useGlobalStore(state => state.activeUser);
//   const adapter = getWebBroadcastAdapter();
//
//   return useVote(currentUser?.username, { adapter });
// }
// ```
