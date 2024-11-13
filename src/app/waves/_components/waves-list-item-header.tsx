import { UserAvatar } from "@/features/shared";
import Link from "next/link";
import i18next from "i18next";
import { dateToRelative } from "@/utils";
import { Spinner } from "@ui/spinner";
import React from "react";
import { useGlobalStore } from "@/core/global-store";
import { WaveEntry } from "@/entities";
import { Button } from "@ui/button";

interface Props {
  entry: WaveEntry;
  hasParent: boolean;
  pure: boolean;
  status: string;
}

export function WavesListItemHeader({ entry, status, hasParent, pure }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return (
    <div className="flex justify-between px-4 pt-4">
      <div className="flex items-center gap-4">
        <UserAvatar size="deck-item" username={entry.author} />
        <div className="flex flex-col truncate">
          <Link className="font-semibold" href={`/@${entry.author}`}>
            {entry.author}
          </Link>
          {activeUser?.username === entry.author && (
            <span className="you">{`(${i18next.t("g.you")})`}</span>
          )}
          {hasParent && !pure && (
            <>
              <span>{i18next.t("decks.columns.replied-to")}</span>
              <Link href={`/@${entry.parent_author}`}>{entry.parent_author}</Link>
            </>
          )}

          <Link
            target="_blank"
            className="text-sm text-gray-600 dark:text-gray-400 after:!content-none hover:underline"
            href={`/created/${entry.category}`}
          >
            #{entry.host}
          </Link>
        </div>
      </div>

      <div className="date">
        {status === "default" && (
          <Link
            target="_blank"
            className="after:!content-none text-gray-600 dark:text-gray-400 hover:underline text-sm font-semibold"
            href={`/@${entry.author}/${entry.permlink}`}
          >
            <Button appearance="gray-link">{`${dateToRelative(entry.created)}`}</Button>
          </Link>
        )}
        {status === "pending" && <Spinner className="w-4 h-4" />}
      </div>
    </div>
  );
}
