import { QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { AccountRelationship } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

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
      const result = await callRPC("bridge.get_relationship_between_accounts", [reference, target]);
      const fallback: AccountRelationship = {
        follows: false,
        ignores: false,
        blacklists: false,
        follows_muted: false,
        follows_blacklists: false,
      };
      return (result ?? fallback) as AccountRelationship;
    },
  });
}
