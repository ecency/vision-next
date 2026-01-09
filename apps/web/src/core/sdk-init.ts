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

// Configure SDK to use relative URLs for private API calls in production
// For development (localhost), use ecency.com directly since we don't have the API
const isDevelopment = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  : process.env.NODE_ENV === 'development';

const privateApiHost = isDevelopment ? "https://ecency.com" : "";
ConfigManager.setPrivateApiHost(privateApiHost);
ConfigManager.setImageHost(defaults.imageServer);

// Initialize DMCA filtering immediately at module load time
// This ensures the lists are available before any React Query fetches execute
// Files are in public/dmca/ for both bundling and mobile app access
ConfigManager.setDmcaLists(dmcaAccounts, dmcaTags, dmcaPosts);
