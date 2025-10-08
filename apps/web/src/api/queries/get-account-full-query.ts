import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client, getAccount, getFollowCount } from "@/api/hive";
import { AccountFollowStats, Reputations } from "@/entities";

export const getAccountFullQuery = (username?: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.GET_ACCOUNT_FULL, username],
    queryFn: async () => {
      if (!username) {
        return null;
      }
      const response = await getAccount(username);
      let follow_stats: AccountFollowStats | undefined;
      try {
        follow_stats = await getFollowCount(username);
      } catch (e) {}

      const reputation: Reputations[] = await client.call(
        "condenser_api",
        "get_account_reputations",
        [username, 1]
      );

      return {
        ...response,
        follow_stats,
        reputation: reputation[0].reputation,
        profile: {
          ...response.profile,
          reputation: reputation[0].reputation
        }
      };
    },
    enabled: !!username,
    staleTime: 60000
  });
