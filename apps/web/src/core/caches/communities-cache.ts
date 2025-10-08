import { EcencyQueriesManager, QueryIdentifiers } from "../react-query";
import { Community } from "@/entities";
import { isCommunity } from "@/utils";
import { bridgeApiCall } from "@/api/bridge";
import { useQueries } from "@tanstack/react-query";

export const getCommunityCache = (category?: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.COMMUNITY, category],
    queryFn: () => {
      if (!isCommunity(category ?? "")) {
        throw new Error("Provided category isn't community");
      }
      return bridgeApiCall<Community | null>("get_community", { name: category, observer: "" });
    },
    enabled: !!category
  });

export const useCommunitiesCache = (categories: string[]) =>
  useQueries({
    queries: categories.map((category) => ({
      queryKey: [QueryIdentifiers.COMMUNITY, category],
      queryFn: () => {
        if (!isCommunity(category ?? "")) {
          throw new Error("Provided category isn't community");
        }
        return bridgeApiCall<Community | null>("get_community", { name: category, observer: "" });
      },
      enabled: !!category
    }))
  });
