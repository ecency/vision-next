"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";
import { ProfileLink, UserAvatar } from "@/features/shared";
import { BookmarksDialog } from "@/features/shared/bookmarks";
import { Button } from "@ui/button";
import { getFavouritesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import Link from "next/link";
import { useMemo, useState } from "react";

const MAX_VISIBLE = 5;

export function MyFavoritesWidget() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const accessToken = useMemo(
    () => (username ? getAccessToken(username) : undefined),
    [username]
  );

  const { data: favorites, isLoading } = useQuery({
    ...getFavouritesQueryOptions(username, accessToken),
    enabled: !!username && !!accessToken
  });

  const [showDialog, setShowDialog] = useState(false);

  if (!activeUser || !accessToken) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="font-semibold">{i18next.t("my-favorites-widget.title")}</div>
      <div className="flex flex-col gap-2 mt-2">
        {isLoading &&
          new Array(MAX_VISIBLE).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        {!isLoading && favorites && favorites.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>{i18next.t("my-favorites-widget.empty")}</p>
            <Link href="/discover" className="text-blue-dark-sky hover:underline mt-1 inline-block">
              {i18next.t("my-favorites-widget.empty-cta")}
            </Link>
          </div>
        )}
        {!isLoading &&
          favorites?.slice(0, MAX_VISIBLE).map((fav) => (
            <ProfileLink key={fav._id} username={fav.account}>
              <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 py-0.5 transition-colors">
                <UserAvatar username={fav.account} size="small" />
                <span className="text-sm truncate">{fav.account}</span>
              </div>
            </ProfileLink>
          ))}
      </div>
      {!isLoading && favorites && favorites.length > MAX_VISIBLE && (
        <Button
          className="mt-2"
          size="sm"
          appearance="gray"
          full={true}
          onClick={() => setShowDialog(true)}
        >
          {i18next.t("my-favorites-widget.view-all")}
        </Button>
      )}
      {showDialog && (
        <BookmarksDialog show={showDialog} setShow={setShowDialog} initialTab="favorites" />
      )}
    </div>
  );
}
