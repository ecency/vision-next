import { UserAvatar } from "@/features/shared";
import Link from "next/link";
import i18next from "i18next";
import { dateToRelative } from "@/utils";
import { Spinner } from "@ui/spinner";
import React from "react";
import { useGlobalStore } from "@/core/global-store";
import { WaveEntry } from "@/entities";
import { Button } from "@ui/button";
import { Badge } from "@ui/badge";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";

interface Props {
  entry: WaveEntry;
  hasParent: boolean;
  pure: boolean;
  status: string;
  interactable: boolean;
  onViewFullThread?: (e: React.MouseEvent) => void;
}

export function WavesListItemHeader({
  entry,
  status,
  hasParent,
  pure,
  onViewFullThread,
  interactable
}: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return (
    <div className="flex justify-between px-4 pt-4">
      <div className="flex items-center gap-4">
        <UserAvatar size="deck-item" username={entry.author} />
        <div className="flex flex-col truncate">
          <div className="flex items-center gap-2">
            <Link className="font-semibold text-sm" href={`/@${entry.author}`}>
              {entry.author}
            </Link>
            {activeUser?.username === entry.author && (
              <Badge className="!py-0 !text-[0.675rem]">{i18next.t("g.you")}</Badge>
            )}
          </div>
          {hasParent && !pure && (
            <>
              <span>{i18next.t("decks.columns.replied-to")}</span>
              <Link href={`/@${entry.parent_author}`}>{entry.parent_author}</Link>
            </>
          )}

          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-40">
            <div>{`${dateToRelative(entry.created)}`}</div>
            {entry.host && (
              <>
                <span>in</span>
                <Link
                  target="_blank"
                  className="after:!content-none hover:underline"
                  href={`/created/${entry.category}`}
                >
                  #{entry.host}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {status === "default" && interactable && (
        <Button
          noPadding={true}
          appearance="gray-link"
          icon={<UilArrowRight />}
          iconPlacement="right"
          size="sm"
          onClick={onViewFullThread}
        />
      )}
      {status === "pending" && <Spinner className="w-4 h-4" />}
    </div>
  );
}
