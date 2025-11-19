import defaults from "@/defaults";
import { shouldUseDefaultBase } from "@/utils/host-utils";
import { headers } from "next/headers";

type HeaderReader = {
  get(name: string): string | null;
};

const getForwardedProto = (headersList: HeaderReader): string => {
  return (
    headersList.get("x-forwarded-proto") ||
    headersList.get("x-forwarded-scheme") ||
    headersList.get("x-forwarded-protocol") ||
    "https"
  );
};

const getForwardedHost = (headersList: HeaderReader): string | null => {
  return headersList.get("x-forwarded-host") || headersList.get("host");
};

export const getServerAppBase = async (): Promise<string> => {
  const envBase = process.env.NEXT_PUBLIC_APP_BASE || process.env.APP_BASE;
  if (envBase) {
    return envBase;
  }

  try {
    const headersList = await headers();
    const host = getForwardedHost(headersList);
    if (host) {
      if (shouldUseDefaultBase(host)) {
        return defaults.base;
      }

      const proto = getForwardedProto(headersList);
      return `${proto}://${host}`;
    }
  } catch (e) {
    // headers() is only available within request/route handlers and server components
    // In tests or build time we may not have access, so gracefully fall back to env/defaults
  }

  return defaults.base;
};
