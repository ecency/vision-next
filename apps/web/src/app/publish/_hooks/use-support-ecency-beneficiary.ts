import { useSupportEcencyBeneficiaryInjection } from "@/features/support-ecency";
import { usePublishState } from "./use-publish-state";

/**
 * This hook controls the voluntary "Support Ecency" beneficiary feature in the
 * publish editor. The preference (a percent of post rewards routed to @ecency)
 * is stored on the user's Ecency account settings; when it is set the row is
 * injected into the current post's beneficiaries once per editor session.
 *
 * Same lifecycle as useDefaultBeneficiary; the dedup / Hive-limit / no-re-add
 * rules live in useSupportEcencyBeneficiaryInjection.
 */
export function useSupportEcencyBeneficiary() {
  const { beneficiaries, setBeneficiaries } = usePublishState();

  useSupportEcencyBeneficiaryInjection(beneficiaries, setBeneficiaries);
}
