import { useMemo } from "react";
import { getDynamicPropsQuery } from "@/api/queries";
import { HiveWallet } from "./hive-wallet";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useActiveUserWallet() {
  const { activeUser } = useActiveAccount();
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  return useMemo(
    () => (activeUser && dynamicProps ? new HiveWallet(activeUser.data, dynamicProps) : undefined),
    [activeUser, dynamicProps]
  );
}
