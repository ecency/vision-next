import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { getDrafts } from "@/api/private-api";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useDraftsQuery() {
  const { activeUser } = useActiveAccount();

  return useQuery({
    queryKey: [QueryIdentifiers.DRAFTS, activeUser?.username],
    queryFn: () => getDrafts(activeUser!.username),
    enabled: !!activeUser
  });
}
