import { queryOptions } from "@tanstack/react-query";
import { ThreeSpeakVideo } from "../types";
import { getBoundFetch, getQueryClient } from "@/modules/core";
import { getAccountTokenQueryOptions } from "./get-account-token-query-options";

export function getAccountVideosQueryOptions(username: string | undefined) {
  return queryOptions({
    queryKey: ["integrations", "3speak", "videos", username],
    enabled: !!username,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(
        getAccountTokenQueryOptions(username)
      );
      const token = getQueryClient().getQueryData(
        getAccountTokenQueryOptions(username).queryKey
      );

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `https://studio.3speak.tv/mobile/api/my-videos`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return (await response.json()) as ThreeSpeakVideo[];
    },
  });
}
