import { infiniteQueryOptions } from "@tanstack/react-query";
import { ConfigManager, QueryKeys } from "@/modules/core";
import { ReferralItem } from "../types/referral";

type PageParam = { maxId?: number };

export function getReferralsInfiniteQueryOptions(username: string) {
  return infiniteQueryOptions({
    queryKey: QueryKeys.accounts.referrals(username),
    initialPageParam: { maxId: undefined } as PageParam,
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      const { maxId } = pageParam ?? {};
      const baseUrl = ConfigManager.getValidatedBaseUrl();
      const url = new URL(`/private-api/referrals/${username}`, baseUrl);

      if (maxId !== undefined) {
        url.searchParams.set("max_id", maxId.toString());
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch referrals: ${response.status}`);
      }

      return response.json() as Promise<ReferralItem[]>;
    },
    getNextPageParam: (lastPage: ReferralItem[]) => {
      const nextMaxId = lastPage?.[lastPage.length - 1]?.id;
      return typeof nextMaxId === "number" ? ({ maxId: nextMaxId } as PageParam) : undefined;
    },
  });
}
