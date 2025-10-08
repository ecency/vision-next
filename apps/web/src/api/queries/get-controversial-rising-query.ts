import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import dayjs, { Dayjs } from "@/utils/dayjs";
import { search } from "@/api/search-api";
import { SearchResponse } from "@/entities";

type PageParam = {
  sid: string | undefined;
  hasNextPage: boolean;
};

export const getControversialRisingQuery = (what: string, tag: string, enabled = true) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.GET_POSTS_CONTROVERSIAL_OR_RISING, what, tag],
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      if (!pageParam.hasNextPage) {
        return {
          hits: 0,
          took: 0,
          results: []
        };
      }

      let sinceDate: Dayjs | undefined;

      switch (tag) {
        case "today":
          sinceDate = dayjs().subtract(1, "day");
          break;
        case "week":
          sinceDate = dayjs().subtract(1, "week");
          break;
        case "month":
          sinceDate = dayjs().subtract(1, "month");
          break;
        case "year":
          sinceDate = dayjs().subtract(1, "year");
          break;
        default:
          sinceDate = undefined;
      }
      let q = "* type:post";
      let sort = what === "rising" ? "children" : what;
      const since = sinceDate ? sinceDate.format("YYYY-MM-DDTHH:mm:ss") : undefined;
      const hideLow_ = "0";
      const votes = tag === "today" ? 50 : 200;

      return search(q, sort, hideLow_, since, pageParam.sid, votes);
    },
    initialData: { pages: [], pageParams: [] },
    initialPageParam: { sid: undefined, hasNextPage: true } as PageParam,
    getNextPageParam: (resp: SearchResponse) => {
      return {
        sid: resp?.scroll_id,
        hasNextPage: resp.results.length > 0
      };
    },
    enabled
  });
