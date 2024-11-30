import { useMemo } from "react";
import { useGlobalStore } from "@/core/global-store";
import { getDynamicPropsQuery } from "@/api/queries";
import { HiveWallet } from "./hive-wallet";

export function useActiveUserWallet() {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  return useMemo(
    () => (activeUser && dynamicProps ? new HiveWallet(activeUser.data, dynamicProps) : undefined),
    [activeUser, dynamicProps]
  );
}
