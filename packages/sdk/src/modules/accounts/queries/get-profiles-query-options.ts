import { queryOptions } from "@tanstack/react-query";
import { Profile } from "../types";
import { getProfiles } from "@/modules/bridge";

export function getProfilesQueryOptions(
  accounts: string[],
  observer?: string,
  enabled = true
) {
  return queryOptions({
    queryKey: ["accounts", "profiles", accounts, observer ?? ""],
    enabled: enabled && accounts.length > 0,
    queryFn: async () => getProfiles(accounts, observer) as Promise<Profile[]>,
  });
}
