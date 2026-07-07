import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch, QueryKeys } from "@/modules/core";
import { SupportSettings } from "../types";

/**
 * Fetch the active user's Support Ecency settings. The username is resolved
 * server-side from the validated `code`, so only the code is sent. Throws on a
 * non-2xx with the server's `.status` + parsed `.data` attached. Exported for
 * unit testing; the query options below wrap it.
 */
export async function getSupportSettingsRequest(code: string): Promise<SupportSettings> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/support-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    let data: unknown = undefined;
    try {
      data = await response.json();
    } catch {
      // non-JSON error body; fall through with status only
    }
    const message =
      (data as { message?: string })?.message ??
      `Failed to fetch support settings: ${response.status}`;
    const err = new Error(message) as Error & { status?: number; data?: unknown };
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return (await response.json()) as SupportSettings;
}

/**
 * Query options for the active user's Support Ecency settings
 * (beneficiary percent + curation holdback percent). Zeros mean both
 * opt-ins are off; the backend returns zeros when no row exists.
 */
export function getSupportSettingsQueryOptions(
  username: string | undefined,
  code: string | undefined
) {
  const name = username?.replace("@", "");

  return queryOptions({
    queryKey: QueryKeys.support.settings(name),
    queryFn: () => {
      if (!code) {
        throw new Error("[SDK][Support] missing auth");
      }
      return getSupportSettingsRequest(code);
    },
    enabled: !!name && !!code,
  });
}
