"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { Entry } from "@/entities";
import i18next from "i18next";
import { EntryMenu } from "@/features/shared";
import { useMemo } from "react";
import { pencilOutlineSvg } from "@ui/svg";
import { useRouter } from "next/navigation";
import { makeEntryPath } from "@/utils";

interface Props {
  entry: Entry;
}

export function EntryPageMainInfoMenu({ entry }: Props) {
  const { activeUser } = useActiveAccount();

  const router = useRouter();

  const isComment = useMemo(() => !!entry.parent_author, [entry]);
  const isOwnEntry = useMemo(
    () => activeUser?.username === entry.author,
    [activeUser?.username, entry.author]
  );
  // Delete is intentionally absent here: EntryMenu already generates its own
  // delete item (modal confirm) for any deletable entry, comments included.
  const extraItems = useMemo(() => {
    const path = makeEntryPath(entry.category, entry.author, entry.permlink);
    return isOwnEntry && isComment && path !== "#"
      ? [
          {
            label: i18next.t("g.edit"),
            onClick: () => router.push(`${path}/edit`),
            icon: pencilOutlineSvg
          }
        ]
      : [];
  }, [entry, isOwnEntry, isComment, router]);

  return <EntryMenu entry={entry} separatedSharing={true} extraMenuItems={extraItems} />;
}
