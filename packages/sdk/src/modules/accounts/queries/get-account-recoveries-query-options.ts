import { CONFIG, getBoundFetch } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { GetRecoveriesEmailResponse } from "../types";

export function getAccountRecoveriesQueryOptions(
  username: string | undefined,
  code: string | undefined
) {
  return queryOptions({
    enabled: !!username && !!code,
    queryKey: ["accounts", "recoveries", username],
    queryFn: async () => {
      if (!code) {
        return [];
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/recoveries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        }
      );

      return response.json() as Promise<GetRecoveriesEmailResponse[]>;
    },
  });
}
