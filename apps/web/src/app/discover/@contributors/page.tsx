import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { getContributorsQuery } from "@/api/queries";
import { ProfileLink, UserAvatar } from "@/features/shared";
import React from "react";
import { UsersTableListLayout } from "@/app/discover/_components";

export default async function ContributorPage() {
  const data = await getContributorsQuery().prefetch();
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <UsersTableListLayout>
        <div className="flex flex-wrap gap-4">
          {data?.map((c, i) => (
            <div
              className="rounded-2xl border border-[--border-color] p-4 bg-gray-100 dark:bg-dark-200"
              key={i}
            >
              <ProfileLink username={c.name} className="flex items-center gap-2 truncate">
                <UserAvatar username={c.name} size="medium" />
                <div className="flex flex-col">
                  <span className="notranslate">@{c.name}</span>
                  <div className="text-sm opacity-50 text-gray-800 dark:text-white">
                    {c.contributes.join(", ")}
                  </div>
                </div>
              </ProfileLink>
            </div>
          ))}
        </div>
      </UsersTableListLayout>
    </HydrationBoundary>
  );
}
