import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { curationRosterListRequest } from "../requests";

/**
 * The admin view of the roster: notes, who added whom, and the retired rows the
 * public roster hides. Admin only upstream, so it is keyed by the viewer and
 * never shares a cache entry with the public roster query.
 */
export function getCurationRosterAdminQueryOptions(
  username: string | undefined,
  code: string | undefined
) {
  return queryOptions({
    queryKey: QueryKeys.curation.rosterAdmin(username),
    queryFn: ({ signal }) => curationRosterListRequest(code, signal),
    enabled: !!username && !!code,
    staleTime: 60_000,
  });
}
