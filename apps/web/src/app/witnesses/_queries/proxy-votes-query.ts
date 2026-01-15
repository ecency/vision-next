import { useSearchParams } from "next/navigation";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

export function useProxyVotesQuery() {
  const searchParams = useSearchParams();

  const { activeUser } = useActiveAccount();
  const voter = searchParams?.get("voter") ?? "";
  const usernameFromParams = searchParams?.get("username") ?? searchParams?.get("account") ?? "";

  const activeUserAccountQuery = useQuery(getAccountFullQueryOptions(activeUser?.username));
  const urlParamAccountQuery = useQuery(getAccountFullQueryOptions(usernameFromParams));
  const voterAccountQuery = useQuery(getAccountFullQueryOptions(voter));

  const shouldUseVoterAccount = Boolean(voter);
  const shouldUseUrlAccount = !shouldUseVoterAccount && Boolean(usernameFromParams);

  const baseAccount = shouldUseVoterAccount
    ? voterAccountQuery.data ?? undefined
    : shouldUseUrlAccount
    ? urlParamAccountQuery.data ?? undefined
    : activeUserAccountQuery.data ?? undefined;

  const baseAccountProxy = baseAccount?.proxy ?? "";
  const proxiedAccountQuery = useQuery(getAccountFullQueryOptions(baseAccountProxy || undefined));

  const baseAccountVotes = baseAccount?.witness_votes ?? [];
  const proxiedAccountVotes = proxiedAccountQuery.data?.witness_votes ?? [];

  const proxyVotes = useMemo(
    () => (baseAccountProxy ? proxiedAccountVotes : baseAccountVotes),
    [baseAccountProxy, proxiedAccountVotes, baseAccountVotes]
  );

  const baseAccountLoading = shouldUseVoterAccount
    ? voterAccountQuery.isLoading
    : shouldUseUrlAccount
    ? urlParamAccountQuery.isLoading
    : activeUserAccountQuery.isLoading;

  const baseAccountFetching = shouldUseVoterAccount
    ? voterAccountQuery.isFetching
    : shouldUseUrlAccount
    ? urlParamAccountQuery.isFetching
    : activeUserAccountQuery.isFetching;

  const proxyAccountLoading = baseAccountProxy ? proxiedAccountQuery.isLoading : false;
  const proxyAccountFetching = baseAccountProxy ? proxiedAccountQuery.isFetching : false;

  return {
    data: proxyVotes,
    isLoading: baseAccountLoading || proxyAccountLoading,
    isFetching: baseAccountFetching || proxyAccountFetching
  };
}
