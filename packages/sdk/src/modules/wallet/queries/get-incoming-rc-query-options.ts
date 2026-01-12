import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch } from "@/modules/core";
import { IncomingRcResponse } from "../types";

export function getIncomingRcQueryOptions(username: string | undefined) {
  return queryOptions({
    queryKey: ["wallet", "incoming-rc", username],
    enabled: !!username,
    queryFn: async (): Promise<IncomingRcResponse> => {
      if (!username) {
        throw new Error("[SDK][Wallet] - Missing username for incoming RC");
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/received-rc/${username}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch incoming RC: ${response.status}`);
      }

      return response.json() as Promise<IncomingRcResponse>;
    },
  });
}
