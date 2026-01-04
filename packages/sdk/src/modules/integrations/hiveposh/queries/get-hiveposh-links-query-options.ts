import { queryOptions } from "@tanstack/react-query";
import { getBoundFetch } from "@/modules/core";

export function getHivePoshLinksQueryOptions(username: string | undefined) {
  return queryOptions({
    queryKey: ["integrations", "hiveposh", "links", username],
    retry: false, // Don't retry on user not found errors
    queryFn: async () => {
      try {
        const fetchApi = getBoundFetch();
        const response = await fetchApi(
          `https://hiveposh.com/api/v0/linked-accounts/${username}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Handle 400 error when user is not registered on HivePosh
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          // Silently return null for "User Not Connected" errors
          if (errorData?.message === "User Not Connected") {
            return null;
          }
        }

        if (!response.ok) {
          return null;
        }

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
      } catch (err) {
        // Silently handle all HivePosh API errors
        return null;
      }
    },
  });
}
