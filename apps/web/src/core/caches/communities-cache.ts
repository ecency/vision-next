import { QueryIdentifiers } from "../react-query";
import { isCommunity } from "@/utils";
import { getCommunityQueryOptions } from "@ecency/sdk";
import { useQueries } from "@tanstack/react-query";

export const getCommunityCache = (category?: string) => ({
  ...getCommunityQueryOptions(category, ""),
  queryKey: [QueryIdentifiers.COMMUNITY, category],
  enabled: !!category && isCommunity(category ?? "")
});

export const useCommunitiesCache = (categories: string[]) =>
  useQueries({
    queries: categories.map((category) => ({
      ...getCommunityQueryOptions(category, ""),
      queryKey: [QueryIdentifiers.COMMUNITY, category],
      enabled: !!category && isCommunity(category ?? "")
    }))
  });
