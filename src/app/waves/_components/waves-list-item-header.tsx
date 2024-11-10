import { UserAvatar } from "@/features/shared";
import Link from "next/link";
import i18next from "i18next";
import { dateToRelative } from "@/utils";
import { Spinner } from "@ui/spinner";
import React from "react";
import { useGlobalStore } from "@/core/global-store";
import { WaveEntry } from "@/entities";

interface Props {
  entry: WaveEntry;
  hasParent: boolean;
  pure: boolean;
  status: string;
}

export function WavesListItemHeader({ entry, status, hasParent, pure }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return (
    <div className="thread-item-header">
      <UserAvatar size="deck-item" username={entry.author} />
      <div className="username truncate">
        <Link href={`/@${entry.author}`}>{entry.author}</Link>
        {activeUser?.username === entry.author && (
          <span className="you">{`(${i18next.t("g.you")})`}</span>
        )}
        {hasParent && !pure && (
          <>
            <span>{i18next.t("decks.columns.replied-to")}</span>
            <Link href={`/@${entry.parent_author}`}>{entry.parent_author}</Link>
          </>
        )}
      </div>
      <div className="host">
        <Link target="_blank" href={`/created/${entry.category}`}>
          #{entry.host}
        </Link>
      </div>

      <div className="date">
        {status === "default" && (
          <Link target="_blank" href={`/@${entry.author}/${entry.permlink}`}>
            {`${dateToRelative(entry.created)}`}
          </Link>
        )}
        {status === "pending" && <Spinner className="w-4 h-4" />}
      </div>
    </div>
  );
}
