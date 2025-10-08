import { CONFIG, getAccessToken } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Fragment } from "../types";

export function getFragmentsQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["posts", "fragments", username],
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/fragments",
        {
          method: "POST",
          body: JSON.stringify({
            code: getAccessToken(username),
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.json() as Promise<Fragment[]>;
    },
    enabled: !!username,
  });
}
