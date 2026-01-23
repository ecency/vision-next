"use client";
import { ProfileEdit } from "./_edit";
import { PermissionsCard } from "./_permissions-card";
import { Preferences } from "./_preferences";
import { ReferralInfo } from "./_referral-info";
import { DmPrivacySettings } from "./_dm-privacy";
import { HiddenItemsSettings } from "./_hidden-items";

export function ProfileSettings() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ProfileEdit />
      <Preferences />

      <DmPrivacySettings />
      <HiddenItemsSettings />

      <PermissionsCard />
      <ReferralInfo />
    </div>
  );
}
