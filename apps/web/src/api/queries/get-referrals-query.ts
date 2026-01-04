import { QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { ReferralItem, ReferralStat } from "@/entities";

// ---- Infinite referrals list ----
type PageParam = { maxId?: number };

export const getReferralsQuery = (username: string) => ({
  queryKey: [QueryIdentifiers.REFERRALS, username],
  initialPageParam: { maxId: undefined } as PageParam,
  queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
    const { maxId } = pageParam ?? {};
    const response = await appAxios.get<ReferralItem[]>(
      apiBase(`/private-api/referrals/${username}`),
      { params: { max_id: maxId } }
    );
    return response.data;
  },
  getNextPageParam: (lastPage: ReferralItem[]) => {
    const nextMaxId = lastPage?.[lastPage.length - 1]?.id;
    return typeof nextMaxId === "number" ? ({ maxId: nextMaxId } as PageParam) : undefined;
  }
});

// ---- Stats (unchanged, just tidy) ----
export const getReferralsStatsQuery = (username: string) => ({
  queryKey: [QueryIdentifiers.REFERRALS_STATS, username],
  queryFn: async () => {
    interface ReferralStatsResponse {
      total?: number;
      rewarded?: number;
    }
    const res = await appAxios.get<ReferralStatsResponse>(
      apiBase(`/private-api/referrals/${username}/stats`)
    );
    if (!res.data) throw new Error("No Referrals for this user!");
    return {
      total: res.data.total ?? 0,
      rewarded: res.data.rewarded ?? 0
    };
  }
});
