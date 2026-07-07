import { CONFIG, getBoundFetch, QueryKeys } from "@/modules/core";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { SupportSettings, UpdateSupportSettingsPayload } from "../types";

/**
 * POST a Support Ecency settings update. Both percents are integers within
 * 0..100 (0 = off); the gateway rejects anything else with a 400. Throws on a
 * non-2xx with the server's `.status` + parsed `.data` attached so the caller
 * can surface the plain validation message. Exported for unit testing; the
 * hook below wraps it.
 */
export async function updateSupportSettingsRequest(
  code: string,
  payload: UpdateSupportSettingsPayload
): Promise<SupportSettings> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/support-settings-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      beneficiary_percent: payload.beneficiary_percent,
      curation_percent: payload.curation_percent,
    }),
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
      `Failed to update support settings: ${response.status}`;
    const err = new Error(message) as Error & { status?: number; data?: unknown };
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return (await response.json()) as SupportSettings;
}

/**
 * Sync the settings cache after a successful update: seed the fresh server
 * response and invalidate so any active observers refetch. Exported for unit
 * testing; `useUpdateSupportSettings` calls it from `onSuccess`.
 */
export function applySupportSettingsUpdate(
  queryClient: QueryClient,
  username: string,
  data: SupportSettings
) {
  queryClient.setQueryData(QueryKeys.support.settings(username), data);
  return queryClient.invalidateQueries({ queryKey: QueryKeys.support.settings(username) });
}

/**
 * Update the user's voluntary Support Ecency opt-ins (post beneficiary percent
 * and curation holdback percent). On success the settings query is refreshed
 * so every surface (publish dialog, settings card, injection hooks) sees the
 * new preference.
 */
export function useUpdateSupportSettings(
  username: string | undefined,
  code: string | undefined
) {
  const queryClient = useQueryClient();
  const name = username?.replace("@", "");

  return useMutation({
    mutationKey: ["support", "settings-update", name],
    mutationFn: async (payload: UpdateSupportSettingsPayload) => {
      if (!name || !code) {
        throw new Error("[SDK][Support] missing auth");
      }
      return updateSupportSettingsRequest(code, payload);
    },
    onSuccess(data) {
      if (name) {
        applySupportSettingsUpdate(queryClient, name, data);
      }
    },
  });
}
