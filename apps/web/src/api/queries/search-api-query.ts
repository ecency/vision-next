import axios from "axios";
import { apiBase } from "@/api/helper";
import { SearchResponse } from "@/entities";
import { QueryIdentifiers } from "@/core/react-query";

export const getSearchApiQuery = (
  q: string,
  sort: string,
  hideLow: boolean,
  since?: string,
  votes?: number
) => ({
  queryKey: [QueryIdentifiers.SEARCH_API, q, sort, hideLow, since, votes],
  queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
    interface SearchApiPayload {
      q: string;
      sort: string;
      hide_low: boolean;
      since?: string;
      scroll_id?: string;
      votes?: number;
    }

    const payload: SearchApiPayload = { q, sort, hide_low: hideLow };

    if (since) {
      payload.since = since;
    }
    if (pageParam) {
      payload.scroll_id = pageParam;
    }
    if (votes !== undefined) {
      payload.votes = votes;
    }

    const response = await axios.post<SearchResponse>(apiBase(`/search-api/search`), payload);
    return response.data;
  },
  initialData: { pages: [], pageParams: [] },
  initialPageParam: undefined,
  getNextPageParam: (lastPage: SearchResponse) => lastPage?.scroll_id,
  enabled: !!q
});
