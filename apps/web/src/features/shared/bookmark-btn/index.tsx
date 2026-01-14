"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Entry } from "@/entities";
import {
  getActiveAccountBookmarksQueryOptions,
  useBookmarkAdd,
  useBookmarkDelete
} from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilBookmark } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { useMemo } from "react";
import "./_index.scss";
import { error, success } from "../feedback";
import { getAccessToken } from "@/utils";
import { useGlobalStore } from "@/core/global-store";

export interface Props {
  entry: Entry;
}

export function BookmarkBtn({ entry }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);
  const accessToken = useMemo(
    () => (username ? getAccessToken(username) : undefined),
    [username]
  );

  const { data: bookmarks = [] } = useQuery({
    ...getActiveAccountBookmarksQueryOptions(username, accessToken),
    enabled: !!username && !!accessToken,
  });

  const bookmarkId = useMemo(() => {
    const bookmark = bookmarks.find(
      (x) => x.author === entry.author && x.permlink == entry.permlink
    );
    return bookmark?._id;
  }, [bookmarks, entry.author, entry.permlink]);

  const { mutateAsync: addBookmark, isPending: isAdding } = useBookmarkAdd(
    username,
    accessToken,
    () => success(i18next.t("bookmark-btn.added")),
    () => error(i18next.t("g.server-error"))
  );
  const { mutateAsync: deleteBookmark, isPending: isDeleting } = useBookmarkDelete(
    username,
    accessToken,
    () => success(i18next.t("bookmark-btn.deleted")),
    () => error(i18next.t("g.server-error"))
  );

  if (!activeUser) {
    // Show button that triggers login when clicked
    return (
      <div className="bookmark-btn" onClick={() => toggleUiProp("login")}>
        <Tooltip content={i18next.t("bookmark-btn.add")}>
          <Button appearance="gray-link" size="sm" icon={<UilBookmark />} />
        </Tooltip>
      </div>
    );
  }

  if (bookmarkId) {
    return (
      <div
        className={`bookmark-btn bookmarked ${isDeleting ? "in-progress" : ""}`}
        onClick={() => deleteBookmark(bookmarkId)}
      >
        <Tooltip content={i18next.t("bookmark-btn.delete")}>
          <Button appearance="gray-link" size="sm" icon={<UilBookmark color="green" />} />
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      className={`bookmark-btn ${isAdding ? "in-progress" : ""}`}
      onClick={() => addBookmark({ author: entry.author, permlink: entry.permlink })}
    >
      <Tooltip content={i18next.t("bookmark-btn.add")}>
        <Button appearance="gray-link" size="sm" icon={<UilBookmark />} />
      </Tooltip>
    </div>
  );
}
