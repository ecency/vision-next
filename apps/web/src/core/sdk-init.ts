/**
 * SDK Initialization - runs immediately when imported
 *
 * This file configures the SDK with DMCA filtering lists before any queries execute.
 * It must be imported early in both client and server entry points to ensure
 * the DMCA lists are available from the first render.
 */

import { ConfigManager } from "@ecency/sdk";
import dmcaAccounts from "../../public/dmca/dmca-accounts.json";
import dmcaTags from "../../public/dmca/dmca-tags.json";
import dmcaPosts from "../../public/dmca/dmca-posts.json";

// Configure SDK to use relative URLs for private API calls
// This allows the web app to use its own Next.js API routes as proxies
// Empty string = relative URLs like "/api/stats" instead of "https://ecency.com/api/stats"
ConfigManager.setPrivateApiHost("");

// Initialize DMCA filtering immediately at module load time
// This ensures the lists are available before any React Query fetches execute
// Files are in public/dmca/ for both bundling and mobile app access
ConfigManager.setDmcaLists(dmcaAccounts, dmcaTags, dmcaPosts);
