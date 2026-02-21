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

// Configure SDK API host based on environment.
// Use relative URLs only on client-side main production domain.
// Keep absolute host on server-side to avoid relative fetch failures in SSR.
const isMainProductionClient =
  typeof window !== "undefined" && window.location.hostname === "ecency.com";

const privateApiHost = isMainProductionClient ? "" : "https://ecency.com";
ConfigManager.setPrivateApiHost(privateApiHost);
ConfigManager.setImageHost(defaults.imageServer);

// Initialize DMCA filtering immediately at module load time
// This ensures the lists are available before any React Query fetches execute
// Files are in public/dmca/ for both bundling and mobile app access
ConfigManager.setDmcaLists({
  accounts: dmcaAccounts.accounts ?? [],
  tags: dmcaTags.tags ?? [],
  posts: dmcaPosts.posts ?? [],
});

// NOTE: Web broadcast adapter is NOT initialized here.
// Following the mobile pattern, each SDK mutation hook should create and pass
// its own adapter instance when calling SDK mutations.
//
// Example usage in a hook:
// ```typescript
// import { useVote } from '@ecency/sdk';
// import { createWebBroadcastAdapter } from '@/providers/sdk';
//
// export function useVoteMutation() {
//   const currentUser = useGlobalStore(state => state.activeUser);
//   const adapter = createWebBroadcastAdapter();
//
//   return useVote(currentUser?.username, { adapter });
// }
// ```
