import { queryOptions } from "@tanstack/react-query";
import { getBoundFetch } from "@/modules/core";

export function getHivePoshLinksQueryOptions(username: string | undefined) {
  return queryOptions({
    queryKey: ["integrations", "hiveposh", "links", username],
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `https://hiveposh.com/api/v0/linked-accounts/${username}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      return {
        twitter: {
          username: data.twitter_username,
          profile: data.twitter_profile,
        },
        reddit: {
          username: data.reddit_username,
          profile: data.reddit_profile,
        },
      } satisfies Record<
        "twitter" | "reddit",
        { username: string; profile: string }
      >;
    },
  });
}
