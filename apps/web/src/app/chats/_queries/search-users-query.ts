import { useQuery } from "@tanstack/react-query";
import { getAccountReputations } from "@/api/hive";

export function useSearchUsersQuery(query: string) {
  return useQuery({
    queryKey: ["chats/search-user", query],
    queryFn: async () => {
      if (!query) {
        return [];
      }
      const response = await getAccountReputations(query.toLowerCase(), 5);
      return response.sort((a, b) => (a.reputation > b.reputation ? -1 : 1));
    },
    initialData: []
  });
}
