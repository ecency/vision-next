import { CONFIG, getBoundFetch, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { GetRecoveriesEmailResponse } from "../types";

export function getAccountRecoveriesQueryOptions(
  username: string | undefined,
  code: string | undefined
) {
  return queryOptions({
    enabled: !!username && !!code,
    queryKey: QueryKeys.accounts.recoveries(username!),
    queryFn: async () => {
      if (!username || !code) {
        throw new Error("[SDK][Accounts] Missing username or access token");
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
