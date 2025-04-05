import { useQuery } from "@tanstack/react-query";
import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { bridgeApiCall, getPostHeader } from "@/api/bridge";
import { Entry } from "@/entities";

export function getPostHeaderQuery(author: string, permlink: string) {
  return EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.POST_HEADER, author, permlink],
    queryFn: () =>
      bridgeApiCall<Entry | null>("get_post_header", {
        author,
        permlink
      }),
    initialData: null
  });
}
