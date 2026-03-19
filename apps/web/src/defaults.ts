import baseDefaults from "./defaults.json";
import { shouldUseDefaultBase } from "./utils/host-utils";
import * as ls from "./utils/local-storage";

const resolveEnvBase = () => {
  const envBase = process.env.NEXT_PUBLIC_APP_BASE || process.env.APP_BASE;
  return envBase && envBase.trim().length > 0 ? envBase : undefined;
};

const resolveRuntimeBase = (): string => {
  const envBase = resolveEnvBase();
  if (envBase) {
    return envBase;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return shouldUseDefaultBase(window.location.hostname)
      ? baseDefaults.base
      : window.location.origin;
  }

  return baseDefaults.base;
};

const defaultImageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || baseDefaults.imageServer;

export const ALLOWED_IMAGE_SERVERS = [
  "https://images.ecency.com",
  "https://images.hive.blog"
];

export const IMAGE_PROXY_FALLBACK = "https://img.ecency.com";
const FALLBACK_SESSION_KEY = "image_proxy_fallback_active";

const defaults = {
  ...baseDefaults,
  base: resolveRuntimeBase(),
  chatBase: process.env.NEXT_PUBLIC_CHAT_BASE || baseDefaults.chatBase,
  get imageServer(): string {
    // User explicitly chose a different server (e.g. images.hive.blog) — always respect that
    const override = ls.get("image_proxy");
    if (override && ALLOWED_IMAGE_SERVERS.includes(override) && override !== defaultImageServer) {
      return override;
    }

    // Automatic fallback when primary is unreachable (detected per session)
    if (typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem(FALLBACK_SESSION_KEY) === "1") {
          return IMAGE_PROXY_FALLBACK;
        }
      } catch {
        // sessionStorage may throw in private browsing / sandboxed iframes
      }
    }

    return defaultImageServer;
  },
  nwsServer: process.env.NEXT_PUBLIC_NWS_SERVER || baseDefaults.nwsServer,
  name: process.env.NEXT_PUBLIC_APP_NAME || baseDefaults.name,
  title: process.env.NEXT_PUBLIC_APP_TITLE || baseDefaults.title,
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || baseDefaults.description,
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || baseDefaults.twitterHandle,
  logo: process.env.NEXT_PUBLIC_APP_LOGO || baseDefaults.logo
};

export default defaults;

export { resolveRuntimeBase };
