import { useMemo } from "react";
import { getDynamicPropsQuery } from "@/api/queries";
import { HiveWallet } from "./hive-wallet";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useActiveUserWallet() {
  const { account } = useActiveAccount();
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  return useMemo(
    () => (account && dynamicProps ? new HiveWallet(account, dynamicProps) : undefined),
    [account, dynamicProps]
  );
}
