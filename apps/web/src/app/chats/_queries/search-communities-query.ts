import { useQuery } from "@tanstack/react-query";
import { getCommunities } from "@/api/bridge";

export function useSearchCommunitiesQuery(query: string) {
  return useQuery({
    queryKey: ["chats/search-communities", query],
    queryFn: async () => {
      const response = await getCommunities("", 5, query.toLowerCase());
      return response ?? [];
    },
    initialData: []
  });
}
