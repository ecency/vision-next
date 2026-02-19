import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useEffect, useMemo } from "react";
import { getAccountFullQueryOptions, QueryKeys } from "@ecency/sdk";

export interface WitnessProxyQueryResult {
  highlightedProxy: string;
  activeUserProxy: string;
}

export function useWitnessProxyQuery() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { activeUser } = useActiveAccount();
  const { data: activeUserAccount } = useQuery(getAccountFullQueryOptions(activeUser?.username));
  const { data: urlParamAccount } = useQuery(
    getAccountFullQueryOptions(searchParams?.get("username") ?? searchParams?.get("account") ?? "")
  );

  const activeUserProxy = activeUserAccount?.proxy ?? "";
  const urlAccountProxy = urlParamAccount?.proxy ?? "";

  const proxyResult = useMemo<WitnessProxyQueryResult>(() => {
    const highlightedProxy = urlAccountProxy || activeUserProxy;

    return { highlightedProxy, activeUserProxy };
  }, [activeUserProxy, urlAccountProxy]);

  useEffect(() => {
    queryClient.setQueryData(QueryKeys.witnesses.proxy(), proxyResult);
  }, [proxyResult, queryClient]);

  useEffect(() => {
    queryClient.refetchQueries({ queryKey: QueryKeys.witnesses.proxy() });
  }, [urlParamAccount, activeUserAccount, queryClient]);

  return useQuery<WitnessProxyQueryResult>({
    queryKey: QueryKeys.witnesses.proxy(),
    queryFn: () => proxyResult,
    initialData: { highlightedProxy: "", activeUserProxy: "" },
    enabled: !!activeUserAccount || !!urlParamAccount
  });
}
