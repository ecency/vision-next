import { QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { GiphyResponse } from "@/entities";

export const GIPHY_API_KEY = "DQ7mV4VsZ749GcCBZEunztICJ5nA4Vef";

// Page = array of GIF items, Cursor = number (offset)
type GifPage = GiphyResponse["data"];
type GifCursor = number;

export const getGifsQuery = (query: string, limit = 20) => ({
  queryKey: [QueryIdentifiers.GIFS, query, limit],
  initialData: { pages: [], pageParams: [] },
  initialPageParam: 0 as GifCursor,

  queryFn: async ({ pageParam }: { pageParam: GifCursor }) => {
    const params = new URLSearchParams();
    params.set("api_key", GIPHY_API_KEY);
    params.set("limit", String(limit));
    params.set("offset", String(pageParam ?? 0));
    if (query !== "") params.set("q", query);

    const url = `https://api.giphy.com/v1/gifs/${
      query === "" ? "trending" : "search"
    }?${params.toString()}`;

    const response = await appAxios<GiphyResponse>(url);
    return response.data.data; // GifPage
  },

  getNextPageParam: (
    lastPage: GifPage,
    _allPages: GifPage[],
    lastPageParam: GifCursor | undefined
  ): GifCursor | undefined => {
    // Handle invalid or zero limit - no pagination
    if (limit <= 0) return undefined;
    if (!lastPage || lastPage.length === 0) return undefined;
    // If Giphy returned fewer than the limit, we're done
    if (lastPage.length < limit) return undefined;
    return (lastPageParam ?? 0) + limit;
  }
});
