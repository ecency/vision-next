import { useSearchParams } from "next/navigation";
import { getAccountFullQuery } from "@/api/queries";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useMemo } from "react";

export function useProxyVotesQuery() {
  const searchParams = useSearchParams();

  const { activeUser } = useActiveAccount();
  const voter = searchParams?.get("voter") ?? "";
  const usernameFromParams = searchParams?.get("username") ?? searchParams?.get("account") ?? "";

  const activeUserAccountQuery = getAccountFullQuery(activeUser?.username).useClientQuery();
  const urlParamAccountQuery = getAccountFullQuery(usernameFromParams).useClientQuery();
  const voterAccountQuery = getAccountFullQuery(voter).useClientQuery();

  const shouldUseVoterAccount = Boolean(voter);
  const shouldUseUrlAccount = !shouldUseVoterAccount && Boolean(usernameFromParams);

  const baseAccount = shouldUseVoterAccount
    ? voterAccountQuery.data ?? undefined
    : shouldUseUrlAccount
    ? urlParamAccountQuery.data ?? undefined
    : activeUserAccountQuery.data ?? undefined;

  const baseAccountProxy = baseAccount?.proxy ?? "";
  const proxiedAccountQuery = getAccountFullQuery(baseAccountProxy || undefined).useClientQuery();

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
