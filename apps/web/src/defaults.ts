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

// The canonical image host, stable across SSR and client (env vars inline
// identically in both bundles). Unlike `defaults.imageServer` — a getter that
// reads the per-user `image_proxy` localStorage override — this never diverges
// after hydration, so it is safe for eager/preloaded above-the-fold images.
export const DEFAULT_IMAGE_SERVER = defaultImageServer;

export const ALLOWED_IMAGE_SERVERS = [
  "https://i.ecency.com",
  "https://images.ecency.com",
  "https://images.hive.blog",
  "https://img.ecency.com"
];

const defaults = {
  ...baseDefaults,
  base: resolveRuntimeBase(),
  chatBase: process.env.NEXT_PUBLIC_CHAT_BASE || baseDefaults.chatBase,
  get imageServer(): string {
    const override = ls.get("image_proxy");
    if (override && ALLOWED_IMAGE_SERVERS.includes(override) && override !== defaultImageServer) {
      return override;
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
