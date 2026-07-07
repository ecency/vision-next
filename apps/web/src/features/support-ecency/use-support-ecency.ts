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

export interface SupportEcencyInjectionOptions {
  /**
   * Gates the injection entirely. Callers must derive this synchronously
   * (e.g. from route params), so it is already false while async detectors
   * (entry/draft queries) are still resolving.
   */
  enabled?: boolean;
  /**
   * Persisted "already handled this post" flag for editors whose beneficiary
   * list survives remounts (the classic submit editor keeps it in localStorage
   * next to the local draft). Without it a reload would re-inject a row the
   * user removed from the same in-progress post. Editors whose beneficiaries
   * state resets on remount (publish) can omit it; a per-mount ref is used
   * then.
   */
  settled?: boolean;
  setSettled?: (value: boolean) => void;
}

/**
 * Injects the user's stored "Support Ecency" beneficiary preference into an
 * editor's beneficiaries state, once per post session.
 *
 * `setBeneficiaries` MUST apply the functional updater to the latest committed
 * list (real React state does; react-use's useLocalStorage setter does NOT,
 * see useAdvancedManager's wrapper), otherwise sibling updates get dropped.
 *
 * Rules:
 * - never injects when the active user IS ecency;
 * - never injects when an "ecency" row already exists (row from a draft or
 *   added manually wins);
 * - never exceeds the 8 beneficiary slots or 10000 total weight Hive limits
 *   (injection is skipped instead);
 * - once the row has been present and the user removed it manually, it is not
 *   re-added for this post (follows the hasSetBeneficiary memo precedent in
 *   useDefaultBeneficiary). Editors with persisted lists keep that guarantee
 *   across reloads via the `settled`/`setSettled` options.
 */
export function useSupportEcencyBeneficiaryInjection(
  beneficiaries: BeneficiaryRoute[] | undefined,
  setBeneficiaries: BeneficiariesFunctionalSetter,
  { enabled = true, settled = false, setSettled }: SupportEcencyInjectionOptions = {}
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
  // never overridden by a re-add. The ref guards the current mount; callers
  // with persisted editor state extend the guard across remounts through the
  // `settled`/`setSettled` options.
  const settledRef = useRef(false);

  useEffect(() => {
    if (!enabled || settledRef.current || settled) {
      return;
    }
    if (!username || username === SUPPORT_ECENCY_ACCOUNT) {
      return;
    }
    const markSettled = () => {
      settledRef.current = true;
      setSettled?.(true);
    };
    if (hasEcencyBeneficiary) {
      markSettled();
      return;
    }
    if (weight <= 0 || !canFitBeneficiary(beneficiaries, weight)) {
      return;
    }

    markSettled();
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
  }, [
    enabled,
    settled,
    setSettled,
    username,
    weight,
    hasEcencyBeneficiary,
    beneficiaries,
    setBeneficiaries
  ]);
}
