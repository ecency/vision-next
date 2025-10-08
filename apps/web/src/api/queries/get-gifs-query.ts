import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { GiphyResponse } from "@/entities";

export const GIPHY_API_KEY = "DQ7mV4VsZ749GcCBZEunztICJ5nA4Vef";

export const getGifsQuery = (query: string, limit = 20) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.GIFS, query],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("api_key", GIPHY_API_KEY);
      params.set("limit", limit.toString());
      params.set("offset", pageParam.toString());

      if (query !== "") params.set("q", query);

      const response = await appAxios<GiphyResponse>(
        `https://api.giphy.com/v1/gifs/${query === "" ? "trending" : "search"}?${params.toString()}`
      );
      return response.data.data;
    },
    initialPageParam: 0,
    initialData: { pages: [], pageParams: [] },
    getNextPageParam: (lastPage, __, lastPageParam) => {
      if (lastPage?.length === 0) {
        return undefined;
      }

      return (lastPageParam ?? 0) + 50;
    }
  });
