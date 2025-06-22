import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { getBookmarks } from "@/api/private-api";
import { useClientActiveUser } from "@/api/queries";

export function useBookmarksQuery() {
  const activeUser = useClientActiveUser();

  return useQuery({
    queryKey: [QueryIdentifiers.BOOKMARKS, activeUser?.username],
    queryFn: () => getBookmarks(activeUser!.username),
    enabled: !!activeUser,
    initialData: [],
    refetchOnMount: true
  });
}
