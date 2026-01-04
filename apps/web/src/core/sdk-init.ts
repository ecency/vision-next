/**
 * SDK Initialization - runs immediately when imported
 *
 * This file configures the SDK with DMCA filtering lists before any queries execute.
 * It must be imported early in both client and server entry points to ensure
 * the DMCA lists are available from the first render.
 */

import { ConfigManager } from "@ecency/sdk";
import dmcaAccounts from "@/dmca-accounts.json";
import dmcaTags from "@/dmca-tags.json";
import dmcaPatterns from "@/dmca.json";

// Initialize DMCA filtering immediately at module load time
// This ensures the lists are available before any React Query fetches execute
ConfigManager.setDmcaLists(dmcaAccounts, dmcaTags, dmcaPatterns);
