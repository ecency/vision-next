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
import { LoginRequired } from "../login-required";
import "./_index.scss";
import { error, success } from "../feedback";
import { getAccessToken } from "@/utils";

export interface Props {
  entry: Entry;
}

export function BookmarkBtn({ entry }: Props) {
  const { activeUser } = useActiveAccount();

  const { data: bookmarks = [] } = useQuery(
    getActiveAccountBookmarksQueryOptions(
      activeUser?.username,
      getAccessToken(activeUser?.username ?? "")
    )
  );

  const bookmarkId = useMemo(() => {
    const bookmark = bookmarks.find(
      (x) => x.author === entry.author && x.permlink == entry.permlink
    );
    return bookmark?._id;
  }, [bookmarks, entry.author, entry.permlink]);

  const { mutateAsync: addBookmark, isPending: isAdding } = useBookmarkAdd(
    activeUser?.username,
    getAccessToken(activeUser?.username ?? ""),
    () => success(i18next.t("bookmark-btn.added")),
    () => error(i18next.t("g.server-error"))
  );
  const { mutateAsync: deleteBookmark, isPending: isDeleting } = useBookmarkDelete(
    activeUser?.username,
    getAccessToken(activeUser?.username ?? ""),
    () => success(i18next.t("bookmark-btn.deleted")),
    () => error(i18next.t("g.server-error"))
  );

  if (!activeUser) {
    return (
      <LoginRequired>
        <div className="bookmark-btn">
          <Tooltip content={i18next.t("bookmark-btn.add")}>
            <Button appearance="gray-link" size="sm" icon={<UilBookmark />} />
          </Tooltip>
        </div>
      </LoginRequired>
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
