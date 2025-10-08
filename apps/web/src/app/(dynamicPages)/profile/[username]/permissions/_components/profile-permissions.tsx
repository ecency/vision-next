"use client";

import { useClientActiveUser } from "@/api/queries";
import { AccountRecovery } from "@/app/(dynamicPages)/profile/[username]/permissions/_components/account-recovery";
import { ManageAuthorities } from "./manage-authorities";
import { ManageKeys } from "./manage-keys";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProfilePermissions() {
  const router = useRouter();
  const activeUser = useClientActiveUser();
  const { username } = useParams<{ username: string }>();

  useEffect(() => {
    if (username !== activeUser?.username) {
      router.replace(`/@${activeUser?.username}/permissions`);
    }
  }, [activeUser?.username, router, username]);

  if (!activeUser || username.replace("%40", "") !== activeUser.username) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ManageAuthorities />
      <ManageKeys />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AccountRecovery />
      </div>
    </div>
  );
}
