"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { BeneficiaryRoute } from "@/entities";
import { getAccessToken } from "@/utils";
import { getSupportSettingsQueryOptions, useUpdateSupportSettings } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

export const SUPPORT_ECENCY_ACCOUNT = "ecency";
export const SUPPORT_ECENCY_DEFAULT_PERCENT = 5;
export const SUPPORT_ECENCY_BENEFICIARY_PRESETS = [1, 5, 10, 25];
export const SUPPORT_ECENCY_CURATION_PRESETS = [5, 10, 25, 50, 100];

/**
 * Hive protocol limits: a comment_options operation accepts at most
 * 8 beneficiary slots and weights are basis points (10000 = 100%).
 */
const HIVE_MAX_BENEFICIARIES = 8;
const HIVE_MAX_TOTAL_WEIGHT = 10000;

/**
 * True when one more beneficiary of the given weight (basis points) still fits
 * into the Hive slot and total weight limits.
 */
export function canFitBeneficiary(
  beneficiaries: BeneficiaryRoute[] | undefined,
  weight: number
): boolean {
  const slots = beneficiaries?.length ?? 0;
  const total = beneficiaries?.reduce((acc, b) => acc + b.weight, 0) ?? 0;
  return slots < HIVE_MAX_BENEFICIARIES && total + weight <= HIVE_MAX_TOTAL_WEIGHT;
}

/**
 * The active user's stored Support Ecency settings (both opt-ins).
 */
export function useSupportEcencySettingsQuery() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  return useQuery(getSupportSettingsQueryOptions(username, getAccessToken(username ?? "")));
}

/**
 * Mutation for the Support Ecency settings, pre-bound to the active user.
 */
export function useSupportEcencySettingsUpdate() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  return useUpdateSupportSettings(username, getAccessToken(username ?? ""));
}

type BeneficiariesFunctionalSetter = (
  updater: (prev: BeneficiaryRoute[] | undefined) => BeneficiaryRoute[]
) => void;

/**
 * Injects the user's stored "Support Ecency" beneficiary preference into an
 * editor's beneficiaries state, once per editor session.
 *
 * Rules:
 * - never injects when the active user IS ecency;
 * - never injects when an "ecency" row already exists (row from a draft or
 *   added manually wins);
 * - never exceeds the 8 beneficiary slots or 10000 total weight Hive limits
 *   (injection is skipped instead);
 * - once the row has been present and the user removed it manually, it is not
 *   re-added for this post (follows the hasSetBeneficiary memo precedent in
 *   useDefaultBeneficiary).
 */
export function useSupportEcencyBeneficiaryInjection(
  beneficiaries: BeneficiaryRoute[] | undefined,
  setBeneficiaries: BeneficiariesFunctionalSetter,
  enabled = true
) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  const { data: beneficiaryPercent } = useQuery({
    ...getSupportSettingsQueryOptions(username, getAccessToken(username ?? "")),
    select: (data) => data?.beneficiary_percent ?? 0
  });

  // Beneficiary weight is basis points: 5% = 500.
  const weight = (beneficiaryPercent ?? 0) * 100;

  const hasEcencyBeneficiary = useMemo(
    () => beneficiaries?.some((b) => b.account === SUPPORT_ECENCY_ACCOUNT) ?? false,
    [beneficiaries]
  );

  // Once the ecency row is present (injected here, restored from a draft or
  // added by the user) this hook stops managing it, so a manual removal is
  // never overridden by a re-add.
  const settledRef = useRef(false);

  useEffect(() => {
    if (!enabled || settledRef.current) {
      return;
    }
    if (!username || username === SUPPORT_ECENCY_ACCOUNT) {
      return;
    }
    if (hasEcencyBeneficiary) {
      settledRef.current = true;
      return;
    }
    if (weight <= 0 || !canFitBeneficiary(beneficiaries, weight)) {
      return;
    }

    settledRef.current = true;
    // Functional update: sibling hooks (community default beneficiary, dialogs)
    // may update the same list in the same commit, so never overwrite blindly.
    setBeneficiaries((prev) => {
      if (
        prev?.some((b) => b.account === SUPPORT_ECENCY_ACCOUNT) ||
        !canFitBeneficiary(prev, weight)
      ) {
        return prev ?? [];
      }
      return [...(prev ?? []), { account: SUPPORT_ECENCY_ACCOUNT, weight }];
    });
  }, [enabled, username, weight, hasEcencyBeneficiary, beneficiaries, setBeneficiaries]);
}
