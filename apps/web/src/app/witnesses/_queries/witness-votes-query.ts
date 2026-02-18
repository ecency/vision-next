import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccountFullQueryOptions, QueryKeys } from "@ecency/sdk";

export function useWitnessVotesQuery() {
  const searchParams = useSearchParams();

  const { activeUser } = useActiveAccount();
  const { data: activeUserAccount } = useQuery(getAccountFullQueryOptions(activeUser?.username));
  const { data: urlParamAccount } = useQuery(
    getAccountFullQueryOptions(searchParams?.get("username") ?? searchParams?.get("account") ?? "")
  );

  const resolvedUsername = urlParamAccount?.name ?? activeUserAccount?.name;

  return useQuery({
    queryKey: QueryKeys.witnesses.votes(resolvedUsername),
    queryFn: () => urlParamAccount?.witness_votes ?? activeUserAccount?.witness_votes ?? []
  });
}
