import { error, success } from "@/features/shared";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import {
  SUPPORT_ECENCY_BENEFICIARY_PRESETS,
  SUPPORT_ECENCY_CURATION_PRESETS,
  useSupportEcencySettingsQuery,
  useSupportEcencySettingsUpdate
} from "@/features/support-ecency";
import { UilHeart } from "@tooni/iconscout-unicons-react";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import Link from "next/link";
import React, { useCallback } from "react";

/**
 * Voluntary "Support Ecency" opt-ins: a post beneficiary percent applied to
 * new posts and a holdback percent on the daily curation reward payout for
 * @ecency delegators. Both persist to the user's Ecency settings.
 */
export function SupportEcencySettings() {
  const { activeUser } = useActiveAccount();

  const { data: settings } = useSupportEcencySettingsQuery();
  const { mutateAsync: updateSettings, isPending } = useSupportEcencySettingsUpdate();

  const beneficiaryPercent = settings?.beneficiary_percent ?? 0;
  const curationPercent = settings?.curation_percent ?? 0;

  const persist = useCallback(
    async (beneficiary: number, curation: number) => {
      try {
        await updateSettings({
          beneficiary_percent: beneficiary,
          curation_percent: curation
        });
        success(i18next.t("preferences.updated"));
      } catch (e) {
        error(i18next.t("g.server-error"));
      }
    },
    [updateSettings]
  );

  return (
    <div className="bg-white rounded-xl p-3 flex flex-col gap-4">
      <div className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
        <UilHeart className="w-4 h-4" />
        {i18next.t("support-ecency.title")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm px-2">{i18next.t("support-ecency.beneficiary-title")}</label>
          <FormControl
            value={beneficiaryPercent}
            type="select"
            disabled={isPending}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              persist(+e.target.value, curationPercent)
            }
          >
            <option value={0}>{i18next.t("g.off")}</option>
            {SUPPORT_ECENCY_BENEFICIARY_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}%
              </option>
            ))}
          </FormControl>
          <div className="text-xs text-gray-600 dark:text-gray-400 px-2">
            {i18next.t("support-ecency.beneficiary-hint")}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm px-2">{i18next.t("support-ecency.curation-title")}</label>
          <FormControl
            value={curationPercent}
            type="select"
            disabled={isPending}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              persist(beneficiaryPercent, +e.target.value)
            }
          >
            <option value={0}>{i18next.t("g.off")}</option>
            {SUPPORT_ECENCY_CURATION_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}%
              </option>
            ))}
          </FormControl>
          <div className="text-xs text-gray-600 dark:text-gray-400 px-2">
            {i18next.t("support-ecency.curation-hint")}
          </div>
        </div>
      </div>

      {activeUser?.username && (
        <div className="text-xs px-2">
          <Link href={`/@${activeUser.username}/wallet/hp`}>
            {i18next.t("support-ecency.delegate-link")}
          </Link>
        </div>
      )}
    </div>
  );
}
