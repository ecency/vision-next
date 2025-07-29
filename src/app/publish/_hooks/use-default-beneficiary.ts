import { usePublishState } from "./use-publish-state";
import { isCommunity } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useEffect } from "react";

export function useDefaultBeneficiary() {
  const { tags, beneficiaries, setBeneficiaries } = usePublishState();

  const { data: communityAccount } = useQuery({
    ...getAccountFullQueryOptions(tags?.[0] ?? ""),
    enabled: isCommunity(tags?.[0])
  });

  useEffect(() => {
    if (communityAccount) {
      const beneficiary = JSON.parse(communityAccount.posting_json_metadata || "{}").beneficiary;
      const hasSetBeneficiary = beneficiaries?.some(
        (ben) => ben.account === tags?.[0] && ben.weight === beneficiary.weight
      );

      if (!hasSetBeneficiary && beneficiary) {
        setBeneficiaries([
          ...(beneficiaries?.filter((b) => b.account !== tags?.[0]) ?? []),
          {
            account: tags?.[0] ?? "",
            weight: beneficiary.weight
          }
        ]);
      }
    }
  }, [beneficiaries, communityAccount, setBeneficiaries, tags]);
}
