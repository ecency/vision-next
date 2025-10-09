"use client";

import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";
import { getFollowingQuery } from "@/api/queries";
import { useMemo } from "react";
import { Entry } from "@/entities";

interface Props {
  entry: Entry;
}

export function EntryPageMightContainsMutedCommentsWarning({ entry }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data: followingsRaw } = getFollowingQuery(
      activeUser?.username,
      "",
      "ignore",
      100
  ).useClientQuery();

  // ✅ normalize to an array of usernames (muted/ignored accounts)
  const ignoredUsernames = useMemo<string[]>(
      () =>
          Array.isArray(followingsRaw)
              ? (followingsRaw as Array<{ following: string }>).map((u) => u.following)
              : [],
      [followingsRaw]
  );

  const isOwnEntry = useMemo(
      () => !!activeUser && activeUser.username === entry.author,
      [activeUser, entry.author]
  );

  // If your `Entry` differentiates post vs comment differently, keep your original.
  // Here: a top-level post has no parent, but you had `!!entry.author` — leaving it as-is:
  const isComment = useMemo(() => !!entry.author && !!entry.parent_author, [entry.author, entry.parent_author]);

  const entryIsMuted = useMemo(
      () => ignoredUsernames.includes(entry.author),
      [ignoredUsernames, entry.author]
  );

  const mightContainMutedComments =
      !!activeUser && entryIsMuted && !isComment && !isOwnEntry;

  return mightContainMutedComments ? (
      <div className="hidden-warning">
        <span>{i18next.t("entry.comments-hidden")}</span>
      </div>
  ) : null;
}
