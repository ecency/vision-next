import { isCommunity, normalizeBeneficiaryWeight } from "@/utils";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { usePrevious } from "react-use";
import { usePublishState } from "./use-publish-state";

/**
 * This hook controls the default beneficiary feature
 *      Default beneficiary settings are storing in the community's same named Hive account hive-xxxxxx
 *      in posting_metadata
 *
 * Whenever community changes it should control beneficiaries logic
 */
export function useDefaultBeneficiary() {
  const { tags, beneficiaries, setBeneficiaries } = usePublishState();
  const previousTags = usePrevious(tags);

  const { data: beneficiary } = useQuery({
    ...getAccountFullQueryOptions(tags?.[0] ?? ""),
    enabled: isCommunity(tags?.[0]),
    select: (data) => data.profile.beneficiary ?? undefined
  });

  const beneficiaryWeight = useMemo(
    () => normalizeBeneficiaryWeight(beneficiary?.weight),
    [beneficiary?.weight]
  );

  const hasSetBeneficiary = useMemo(
    () =>
      beneficiaryWeight !== undefined &&
      beneficiaries?.some((ben) => ben.account === tags?.[0] && ben.weight === beneficiaryWeight),
    [beneficiaries, beneficiaryWeight, tags]
  );

  // In case of existing default beneficiary settings in community account it should be populated and never removed
  useEffect(() => {
    if (beneficiaryWeight !== undefined && isCommunity(tags?.[0]) && !hasSetBeneficiary) {
      setBeneficiaries([
        ...(beneficiaries?.filter((b) => b.account !== tags?.[0]) ?? []),
        {
          account: tags?.[0] ?? "",
          weight: beneficiaryWeight
        }
      ]);
    }
  }, [
    beneficiaryWeight,
    beneficiaries,
    hasSetBeneficiary,
    setBeneficiaries,
    tags
  ]);

  // In case of removing community tag and there is some beneficiary with this community
  //    it should be cleared to avoid any unnecessary beneficiaries
  useEffect(() => {
    const tag = previousTags?.[0];
    if (tag && isCommunity(tag) && tags?.[0] !== tag) {
      setBeneficiaries(beneficiaries?.filter((ben) => ben.account !== tag));
    }
  }, [beneficiaries, previousTags, setBeneficiaries, tags]);
}
