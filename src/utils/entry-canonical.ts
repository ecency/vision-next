import { Entry } from "@/entities";
import rawApps from "@hiveio/hivescript/apps.json";
import defaults from "@/defaults.json";
import { appName } from "./app-name";
import { makeEntryPath } from "./make-path";

type AppInfo = {
  name: string;
  homepage: string;
  url_scheme?: string;
};

type AppsMap = Record<string, AppInfo>;

const apps = rawApps as AppsMap;

export function entryCanonical(entry: Entry, isAmp = false): string | null {
  const path = makeEntryPath(entry.category, entry.author, entry.permlink);
  if (path === "#") {
    return null;
  }
  if (isAmp) {
    return `${defaults.base}${path}`;
  }

  const canonicalFromMetadata = entry.json_metadata?.canonical_url;
  if (canonicalFromMetadata) {
    return canonicalFromMetadata.replace("https://www.", "https://");
  }

  const app = appName(entry.json_metadata?.app);
  const identifier = app?.split("/")[0];

  if (!identifier || ["ecency", "esteem"].includes(identifier)) {
    return `${defaults.base}${path}`;
  }

  const appInfo = apps[identifier] as { url_scheme?: string };
  if (!appInfo?.url_scheme) {
    return `${defaults.base}${path}`;
  }

  return appInfo.url_scheme
    .replace("{category}", entry.category)
    .replace("{username}", entry.author)
    .replace("{permlink}", entry.permlink);
}

