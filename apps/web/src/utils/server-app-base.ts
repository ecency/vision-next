import defaults from "@/defaults";
import { headers } from "next/headers";

const getForwardedProto = (headersList: Headers): string => {
  return (
    headersList.get("x-forwarded-proto") ||
    headersList.get("x-forwarded-scheme") ||
    headersList.get("x-forwarded-protocol") ||
    "https"
  );
};

const getForwardedHost = (headersList: Headers): string | null => {
  return headersList.get("x-forwarded-host") || headersList.get("host");
};

export const getServerAppBase = (): string => {
  try {
    const headersList = headers();
    const host = getForwardedHost(headersList);
    if (host) {
      const proto = getForwardedProto(headersList);
      return `${proto}://${host}`;
    }
  } catch (e) {
    // headers() is only available within request/route handlers and server components
    // In tests or build time we may not have access, so gracefully fall back to env/defaults
  }

  return process.env.NEXT_PUBLIC_APP_BASE || process.env.APP_BASE || defaults.base;
};
