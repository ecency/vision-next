import { queryOptions } from "@tanstack/react-query";
import { ThreeSpeakVideo } from "../types";
import { getBoundFetch, getQueryClient } from "@/modules/core";
import { getAccountTokenQueryOptions } from "./get-account-token-query-options";

export function getAccountVideosQueryOptions(
  username: string | undefined,
  accessToken: string | undefined
) {
  return queryOptions({
    queryKey: ["integrations", "3speak", "videos", username],
    enabled: !!username && !!accessToken,
    queryFn: async () => {
      if (!username || !accessToken) {
        throw new Error("[SDK][Integrations][3Speak] – anon user");
      }

      const tokenQueryOptions = getAccountTokenQueryOptions(
        username,
        accessToken
      );

      await getQueryClient().prefetchQuery(tokenQueryOptions);
      const token = getQueryClient().getQueryData(tokenQueryOptions.queryKey);
      if (!token) {
        throw new Error("[SDK][Integrations][3Speak] – missing account token");
      }

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
