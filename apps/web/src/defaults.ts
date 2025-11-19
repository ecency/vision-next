import baseDefaults from "./defaults.json";

const resolveEnvBase = () => {
  const envBase = process.env.NEXT_PUBLIC_APP_BASE || process.env.APP_BASE;
  return envBase && envBase.trim().length > 0 ? envBase : undefined;
};

const resolveRuntimeBase = (): string => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return resolveEnvBase() || baseDefaults.base;
};

const defaults = {
  ...baseDefaults,
  base: resolveRuntimeBase(),
  imageServer: process.env.NEXT_PUBLIC_IMAGE_SERVER || baseDefaults.imageServer,
  nwsServer: process.env.NEXT_PUBLIC_NWS_SERVER || baseDefaults.nwsServer,
  name: process.env.NEXT_PUBLIC_APP_NAME || baseDefaults.name,
  title: process.env.NEXT_PUBLIC_APP_TITLE || baseDefaults.title,
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || baseDefaults.description,
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || baseDefaults.twitterHandle,
  logo: process.env.NEXT_PUBLIC_APP_LOGO || baseDefaults.logo
};

export default defaults;

export { resolveRuntimeBase };
