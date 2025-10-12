import { QueryIdentifiers } from "@/core/react-query";
import { lookupAccounts } from "@/api/hive";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { useQuery } from "@tanstack/react-query";
import { useClientActiveUser } from "@/api/queries/useClientActiveUser";

export function useSearchByUsernameQuery(query: string, excludeActiveUser = false) {
  const activeUser = useClientActiveUser();

  return useQuery({
    queryKey: [
      QueryIdentifiers.SEARCH_BY_USERNAME,
      query,
      excludeActiveUser ? activeUser?.username : undefined
    ],
    enabled: !!query,
    staleTime: Infinity,
    refetchOnMount: true,
    queryFn: async () => {
      if (!query) {
        return [];
      }

      try {
        const resp = await lookupAccounts(query, 5);

        if (!resp) {
          return [];
        }

        return resp.filter((item) => (excludeActiveUser ? item !== activeUser?.username : true));
      } catch (e) {
        error(...formatError(e));
        return [];
      }
    },
    placeholderData: []
  });
}
