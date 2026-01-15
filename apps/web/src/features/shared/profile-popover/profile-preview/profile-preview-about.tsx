import i18next from "i18next";
import Link from "next/link";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

interface Props {
  username: string;
}

export function ProfilePreviewAbout({ username }: Props) {
  const { data: profile, isLoading } = useQuery(getAccountFullQueryOptions(username));

  return (
    <div className="text-sm">
      {isLoading && (
        <div className="animate-pulse h-[48px] rounded-lg w-full bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      )}

      {profile?.profile?.about && (
        <div className="flex flex-col gap-2 md:gap-4 p-4">
          <div className="font-bold text-xs uppercase opacity-50">
            {i18next.t("profile-edit.about")}
          </div>
          <Link href={`/@${username}`} className="line-clamp-5">
            {profile.profile.about}
          </Link>
        </div>
      )}
    </div>
  );
}
