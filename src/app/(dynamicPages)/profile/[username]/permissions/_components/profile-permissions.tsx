"use client";

import { useClientActiveUser } from "@/api/queries";
import { PasswordUpdate } from "@/app/(dynamicPages)/profile/[username]/permissions/_components/password-update";
import { AccountRecovery } from "@/app/(dynamicPages)/profile/[username]/permissions/_components/account-recovery";
import { useState } from "react";
import { ManageAuthorities } from "./manage-authorities";
import { ManageKeys } from "./manage-keys";

export function ProfilePermissions() {
  const activeUser = useClientActiveUser();

  const [tabState, setTabState] = useState("0");

  if (!activeUser) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ManageAuthorities />
      <ManageKeys />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AccountRecovery />
      </div>

      {tabState === "2" && <PasswordUpdate />}
    </div>
  );
}
