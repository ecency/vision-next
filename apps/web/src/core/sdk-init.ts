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

// Configure SDK API host based on environment
// Only use relative URLs (self-hosted API) on main production domain
// All other environments (localhost, alpha, staging, etc.) use ecency.com API
const isMainProduction = typeof window !== 'undefined'
  ? window.location.hostname === 'ecency.com'
  : process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_BASE === 'https://ecency.com';

const privateApiHost = isMainProduction ? "" : "https://ecency.com";
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
