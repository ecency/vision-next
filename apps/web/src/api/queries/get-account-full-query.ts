import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { getAccount } from "@/api/hive";
import { getProfiles } from "@/api/bridge";
import { AccountFollowStats } from "@/entities";

export const getAccountFullQuery = (username?: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.GET_ACCOUNT_FULL, username],
    queryFn: async () => {
      if (!username) {
        return null;
      }
      const [response, profiles] = await Promise.all([
        getAccount(username),
        getProfiles([username]).catch(() => undefined)
      ]);

      if (!response) {
        return null;
      }

      const profile = profiles?.[0];
      const follow_stats: AccountFollowStats | undefined = profile
        ? {
            account: username,
            follower_count: profile.stats?.followers,
            following_count: profile.stats?.following
          }
        : undefined;

      return {
        ...response,
        follow_stats,
        reputation: profile?.reputation ?? response.reputation,
        profile: {
          ...response.profile,
          reputation: profile?.reputation ?? response.profile?.reputation
        }
      };
    },
    enabled: !!username,
    staleTime: 60000
  });
