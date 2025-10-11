import { CONFIG, getAccessToken, getBoundFetch } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { GetRecoveriesEmailResponse } from "../types";

export function getAccountRecoveriesQueryOptions(username: string | undefined) {
  return queryOptions({
    enabled: !!username,
    queryKey: ["accounts", "recoveries", username],
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/recoveries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: getAccessToken(username!) }),
        }
      );

      return response.json() as Promise<GetRecoveriesEmailResponse[]>;
    },
  });
}
