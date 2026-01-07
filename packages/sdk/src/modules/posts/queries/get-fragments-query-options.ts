import { CONFIG, getBoundFetch } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Fragment } from "../types";

export function getFragmentsQueryOptions(username: string, code?: string) {
  return queryOptions({
    queryKey: ["posts", "fragments", username],
    queryFn: async () => {
      if (!code) {
        return [];
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments",
        {
          method: "POST",
          body: JSON.stringify({
            code,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.json() as Promise<Fragment[]>;
    },
    enabled: !!username && !!code,
  });
}
