import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { useQuery } from "@tanstack/react-query";
import { useClientActiveUser } from "@/api/queries/useClientActiveUser";
import { lookupAccountsQueryOptions } from "@ecency/sdk";

export function useSearchByUsernameQuery(query: string, excludeActiveUser = false) {
  const activeUser = useClientActiveUser();
  const baseQueryOptions = lookupAccountsQueryOptions(query, 5);

  return useQuery({
    ...baseQueryOptions,
    queryKey: [
      ...baseQueryOptions.queryKey,
      excludeActiveUser ? activeUser?.username : undefined,
    ],
    refetchOnMount: true,
    queryFn: async () => {
      if (!query) {
        return [];
      }

      try {
        const resp = await baseQueryOptions.queryFn();

        if (!resp) {
          return [];
        }

        return resp.filter((item) => (excludeActiveUser ? item !== activeUser?.username : true));
      } catch (e) {
        error(...formatError(e));
        return [];
      }
    },
    placeholderData: [],
  });
}
