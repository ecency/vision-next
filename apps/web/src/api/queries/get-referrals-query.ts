import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { ReferralItem, ReferralStat } from "@/entities";

export const getReferralsQuery = (username: string) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.REFERRALS, username],
    queryFn: async ({ pageParam: { maxId } }: { pageParam: { maxId?: number } }) => {
      const response = await appAxios.get<ReferralItem[]>(
        apiBase(`/private-api/referrals/${username}`),
        {
          params: {
            max_id: maxId
          }
        }
      );
      return response.data;
    },
    initialPageParam: {},
    getNextPageParam: (lastPage: ReferralItem[]) => ({
      maxId: lastPage?.[lastPage.length - 1]?.id
    })
  });

export const getReferralsStatsQuery = (username: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.REFERRALS_STATS, username],
    queryFn: async () => {
      try {
        interface ReferralStatsResponse {
          total?: number;
          rewarded?: number;
        }

        const res = await appAxios.get<ReferralStatsResponse>(
          apiBase(`/private-api/referrals/${username}/stats`)
        );
        if (!res.data) {
          throw new Error("No Referrals for this user!");
        }
        const convertReferralStat = (rawData: ReferralStatsResponse): ReferralStat => ({
          total: rawData.total ?? 0,
          rewarded: rawData.rewarded ?? 0
        });
        return convertReferralStat(res.data);
      } catch (error) {
        console.warn(error);
        throw error;
      }
    }
  });
