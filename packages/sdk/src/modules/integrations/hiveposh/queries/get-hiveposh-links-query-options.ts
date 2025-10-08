import { queryOptions } from "@tanstack/react-query";

export function getHivePoshLinksQueryOptions(username: string | undefined) {
  return queryOptions({
    queryKey: ["integrations", "hiveposh", "links", username],
    queryFn: async () => {
      const response = await fetch(
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
