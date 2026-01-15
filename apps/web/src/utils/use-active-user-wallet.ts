import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";
import { HiveWallet } from "./hive-wallet";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useActiveUserWallet() {
  const { account } = useActiveAccount();
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());

  return useMemo(
    () => (account && dynamicProps ? new HiveWallet(account, dynamicProps) : undefined),
    [account, dynamicProps]
  );
}
