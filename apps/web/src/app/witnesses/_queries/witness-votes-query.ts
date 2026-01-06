import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { useSearchParams } from "next/navigation";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccountFullQueryOptions } from "@ecency/sdk";

export function useWitnessVotesQuery() {
  const searchParams = useSearchParams();

  const { activeUser } = useActiveAccount();
  const { data: activeUserAccount } = useQuery(getAccountFullQueryOptions(activeUser?.username));
  const { data: urlParamAccount } = useQuery(
    getAccountFullQueryOptions(searchParams?.get("username") ?? searchParams?.get("account") ?? "")
  );

  return useQuery({
    queryKey: [
      QueryIdentifiers.WITNESSES_VOTES,
      urlParamAccount?.name ?? activeUserAccount?.name,
      "votes"
    ],
    queryFn: () => urlParamAccount?.witness_votes ?? activeUserAccount?.witness_votes ?? []
  });
}
