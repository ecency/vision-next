import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { useSearchParams } from "next/navigation";
import { getAccountFullQuery } from "@/api/queries";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useEffect, useMemo } from "react";

export interface WitnessProxyQueryResult {
  highlightedProxy: string;
  activeUserProxy: string;
}

export function useWitnessProxyQuery() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { activeUser } = useActiveAccount();
  const { data: activeUserAccount } = getAccountFullQuery(activeUser?.username).useClientQuery();
  const { data: urlParamAccount } = getAccountFullQuery(
    searchParams?.get("username") ?? searchParams?.get("account") ?? ""
  ).useClientQuery();

  const activeUserProxy = activeUserAccount?.proxy ?? "";
  const urlAccountProxy = urlParamAccount?.proxy ?? "";

  const proxyResult = useMemo<WitnessProxyQueryResult>(() => {
    const highlightedProxy = urlAccountProxy || activeUserProxy;

    return { highlightedProxy, activeUserProxy };
  }, [activeUserProxy, urlAccountProxy]);

  useEffect(() => {
    queryClient.setQueryData([QueryIdentifiers.WITNESSES, "proxy"], proxyResult);
  }, [proxyResult, queryClient]);

  useEffect(() => {
    queryClient.refetchQueries({ queryKey: [QueryIdentifiers.WITNESSES, "proxy"] });
  }, [urlParamAccount, activeUserAccount, queryClient]);

  return useQuery<WitnessProxyQueryResult>({
    queryKey: [QueryIdentifiers.WITNESSES, "proxy"],
    queryFn: () => proxyResult,
    initialData: { highlightedProxy: "", activeUserProxy: "" },
    enabled: !!activeUserAccount || !!urlParamAccount
  });
}
