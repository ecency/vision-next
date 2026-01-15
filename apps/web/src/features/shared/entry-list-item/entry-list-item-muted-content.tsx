"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import Image from "next/image";
import i18next from "i18next";
import React, { useEffect, useMemo, useState } from "react";
import { Entry } from "@/entities";
import { EntryListItemThumbnail } from "@/features/shared/entry-list-item/entry-list-item-thumbnail";
import { EntryLink } from "@/features/shared";
import { postBodySummary } from "@ecency/render-helper";
import { useGlobalStore } from "@/core/global-store";
import { EcencyClientServerBridge } from "@/core/client-server-bridge";
import { EntryListItemContext } from "@/features/shared/entry-list-item/entry-list-item-context";
import { getMutedUsersQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { UilMapPinAlt } from "@tooni/iconscout-unicons-react";
import { useEntryLocation } from "@/utils";

interface Props {
  entry: Entry;
}

export function EntryListItemMutedContent({ entry: entryProp }: Props) {
  const { activeUser } = useActiveAccount();
  const globalNsfw = useGlobalStore((s) => s.nsfw);
  const { showNsfw } = EcencyClientServerBridge.useSafeContext(EntryListItemContext);

  const [showMuted, setShowMuted] = useState(false);
  const [showModMuted, setShowModMuted] = useState(false);
  const { data: mutedUsers } = useQuery(getMutedUsersQueryOptions(activeUser?.username));

  const location = useEntryLocation(entryProp);

  const isPostMuted = useMemo(
    () => (activeUser && mutedUsers?.includes(entryProp.author)) ?? false,
    [activeUser, entryProp.author, mutedUsers]
  );
  const entry = useMemo(() => entryProp.original_entry || entryProp, [entryProp]);
  const isCrossPost = useMemo(() => !!entry.original_entry, [entry.original_entry]);
  const entryActiveVotesLength = entry.active_votes?.length ?? 0;
  const isHidden = useMemo(
    () => (entry.net_rshares ?? 0) < -7000000000 && entryActiveVotesLength > 3,
    [entry.net_rshares, entryActiveVotesLength]
  );
  const nsfw = useMemo(
    () =>
      entry.json_metadata &&
      entry.json_metadata.tags &&
      Array.isArray(entry.json_metadata.tags) &&
      entry.json_metadata.tags.includes("nsfw"),
    [entry]
  );

  useEffect(() => {
    setShowMuted(false);
  }, [activeUser]);

  useEffect(() => {
    setShowMuted(isPostMuted);
  }, [isPostMuted]);

  useEffect(() => {
    setShowModMuted((entry.stats?.gray ?? false) || isHidden);
  }, [entry, isHidden]);

  if (nsfw && !showNsfw && !globalNsfw) {
    return <></>;
  }

  const shouldShowMutedOverlay = showModMuted || showMuted;

  return shouldShowMutedOverlay ? (
    <>
      <div className="item-image item-image-nsfw">
        <Image
          width={600}
          height={600}
          className="w-full"
          src="/assets/nsfw.png"
          alt={entry.title}
        />
      </div>
      <div className="item-summary">
        <div className="item-nsfw-options mt-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              showModMuted ? setShowModMuted(false) : setShowMuted(false);
            }}
          >
            {showModMuted ? i18next.t("g.modmuted-message") : i18next.t("g.muted-message")}
          </a>
        </div>
      </div>
    </>
  ) : (
    <>
      {(!nsfw || showNsfw || globalNsfw) && (
        <EntryListItemThumbnail
          entryProp={entryProp}
          isCrossPost={isCrossPost}
          noImage="/assets/noimage.png"
          entry={entry}
        />
      )}
      <div className="item-summary overflow-x-hidden">
        <EntryLink entry={isCrossPost ? entryProp : entry}>
          <div className="item-title !mb-0">{entry.title}</div>
        </EntryLink>
        {location?.coordinates && (
          <Link
            href={`https://maps.google.com/?q=${location.coordinates.lat},${location.coordinates.lng}`}
            target="_external"
            rel="noopener"
            className="text-sm"
          >
            <UilMapPinAlt className="w-4 h-4 mr-1" />
            {location.address}
          </Link>
        )}
        <EntryLink entry={isCrossPost ? entryProp : entry}>
          <div className="item-body">
            {entry.json_metadata?.description || postBodySummary(entry, 200)}
          </div>
        </EntryLink>
      </div>
    </>
  );
}
