import baseDefaults from "./defaults.json";
import { shouldUseDefaultBase } from "./utils/host-utils";

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

const defaults = {
  ...baseDefaults,
  base: resolveRuntimeBase(),
  chatBase: process.env.NEXT_PUBLIC_CHAT_BASE || baseDefaults.chatBase,
  get imageServer(): string {
    if (typeof window !== "undefined") {
      try {
        const override = localStorage.getItem("ecency_image_proxy");
        if (override) {
          const parsed = JSON.parse(override);
          if (ALLOWED_IMAGE_SERVERS.includes(parsed)) {
            return parsed;
          }
        }
      } catch (e) {
        // ignore
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
