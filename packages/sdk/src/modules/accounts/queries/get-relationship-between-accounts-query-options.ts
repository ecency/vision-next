import { CONFIG, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { AccountRelationship } from "../types";

export function getRelationshipBetweenAccountsQueryOptions(
  reference: string,
  target: string
) {
  return queryOptions({
    queryKey: QueryKeys.accounts.relations(reference, target),
    enabled: !!reference && !!target,
    refetchOnMount: false,
    refetchInterval: 3_600_000,
    queryFn: async () => {
      return (await CONFIG.hiveClient.call(
        "bridge",
        "get_relationship_between_accounts",
        [reference, target]
      )) as AccountRelationship;
    },
  });
}
