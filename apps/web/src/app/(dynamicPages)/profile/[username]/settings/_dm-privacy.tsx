"use client";

import { useDmPrivacyQuery, useUpdateDmPrivacy, DmPrivacyLevel } from "@/features/chat/mattermost-api";
import { success } from "@/features/shared";
import { UilShield } from "@tooni/iconscout-unicons-react";
import { FormControl } from "@ui/input";
import i18next from "i18next";

export function DmPrivacySettings() {
  const { data: privacy, isLoading, isError } = useDmPrivacyQuery();
  const { mutate: updatePrivacy } = useUpdateDmPrivacy();

  if (isLoading || isError) return null;

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrivacy = e.target.value as DmPrivacyLevel;
    updatePrivacy(newPrivacy, {
      onSuccess: () => {
        success(i18next.t("settings.dm-privacy-updated"));
      },
      onError: (error) => {
        // Error is already thrown and will be caught by error boundary
        console.error("Failed to update DM privacy:", error);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 flex flex-col gap-4">
      <div className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
        <UilShield className="w-4 h-4" />
        {i18next.t("settings.dm-privacy.title")}
      </div>

      <div>
        <label className="text-sm px-2 mb-2 block">
          {i18next.t("settings.dm-privacy.who-can-message")}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-3">
          {i18next.t("settings.dm-privacy.description")}
        </p>
        <FormControl value={privacy || "all"} type="select" onChange={handlePrivacyChange}>
          <option value="all">{i18next.t("settings.dm-privacy.allow-all")}</option>
          <option value="followers">{i18next.t("settings.dm-privacy.followers-only")}</option>
          <option value="none">{i18next.t("settings.dm-privacy.no-one")}</option>
        </FormControl>
      </div>
    </div>
  );
}
