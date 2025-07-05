import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { useSearchParams } from "next/navigation";
import { getAccountFullQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";

export function useWitnessVotesQuery() {
  const searchParams = useSearchParams();

  const activeUser = useGlobalStore((state) => state.activeUser);
  const { data: activeUserAccount } = getAccountFullQuery(activeUser?.username).useClientQuery();
  const { data: urlParamAccount } = getAccountFullQuery(
    searchParams?.get("username") ?? searchParams?.get("account") ?? ""
  ).useClientQuery();

  return useQuery({
    queryKey: [
      QueryIdentifiers.WITNESSES_VOTES,
      urlParamAccount?.name ?? activeUserAccount?.name,
      "votes"
    ],
    queryFn: () => urlParamAccount?.witness_votes ?? activeUserAccount?.witness_votes ?? []
  });
}
