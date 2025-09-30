"use client";

import React from "react";
import { setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import defaults from "@/defaults.json";
import { Account, Community, Entry, FullAccount } from "@/entities";
import { makeEntryPath } from "@/utils";
import { pinSvg, repeatSvg } from "@ui/svg";
import {
  EntryMenu,
  EntryPayout,
  EntryReblogBtn,
  EntryVoteBtn,
  EntryVotes,
  ProfileLink,
  ProfilePopover,
  UserAvatar,
  TimeLabel
} from "@/features/shared";
import { classNameObject } from "@ui/util";
import i18next from "i18next";
import { TagLink } from "@/features/shared/tag";
import { Tooltip } from "@ui/tooltip";
import { EntryListItemCrossPost } from "@/features/shared/entry-list-item/entry-list-item-cross-post";
import { EntryListItemMutedContent } from "@/features/shared/entry-list-item/entry-list-item-muted-content";
import { EntryListItemProvider } from "@/features/shared/entry-list-item/entry-list-item-context";
import { EntryListItemNsfwContent } from "@/features/shared/entry-list-item/entry-list-item-nsfw-content";
import { EntryListItemPollIcon } from "@/features/shared/entry-list-item/entry-list-item-poll-icon";
import { UilComment } from "@tooni/iconscout-unicons-react";

setProxyBase(defaults.imageServer);

interface Props {
  entry: Entry;
  community?: Community | null;
  asAuthor?: string;
  promoted?: boolean;
  order: number;
  account?: Account;
  filter?: string;
  now?: number;
}

export function EntryListItemComponent({
  asAuthor = "",
  entry: entryProp,
  community,
  account,
  promoted = false,
  order,
  filter,
  now
}: Props) {
  const pageAccount = account as FullAccount;

  const isCrossPost = !!entryProp.original_entry;
  const entry = entryProp.original_entry || entryProp;
  const pinned = entry?.stats?.is_pinned ?? pageAccount?.profile?.pinned;

  const reBlogged =
    entry.reblogged_by?.length > 0
      ? entry.reblogged_by[0]
      : asAuthor && asAuthor !== entry.author && !entry.parent_author
        ? asAuthor
        : undefined;

  return (
    <div
      className={classNameObject({
        "entry-list-item": true,
        "promoted-item": promoted,
        [filter ?? ""]: !!filter
      })}
      id={(entry.author + entry.permlink).replace(/[0-9]/g, "")}
    >
      <EntryListItemCrossPost entry={entryProp} />
      <div className="item-header">
        <div className="item-header-main">
          <div className="author-part" id={`${entry.author}-${entry.permlink}`}>
            <div className="flex items-center" id={`${entry.author}-${entry.permlink}`}>
              <ProfileLink username={entry.author}>
                <span className="author-avatar block">
                  <UserAvatar username={entry.author} size="small" />
                </span>
              </ProfileLink>

              <ProfilePopover entry={entry} />
            </div>
          </div>
          <TagLink
            type="link"
            tag={
              entry.community && entry.community_title
                ? { name: entry.community, title: entry.community_title }
                : entry.category
            }
          >
            <>{entry.community_title || entry.category}</>
          </TagLink>
          <span className="read-mark ml-2" />
          <TimeLabel created={entry.created} refresh={now} />

          <EntryListItemPollIcon entry={entryProp} />
        </div>
        <div className="item-header-features">
          {((community && !!entry.stats?.is_pinned) || entry.permlink === pinned) && (
            <Tooltip content={i18next.t("entry-list-item.pinned")}>
              <span className="pinned">{pinSvg}</span>
            </Tooltip>
          )}
          {reBlogged && (
            <span className="reblogged">
              {repeatSvg} {i18next.t("entry-list-item.reblogged", { n: reBlogged })}
            </span>
          )}
          {promoted && (
            <>
              <span className="flex-spacer" />
              <div className="promoted">
                <a href="/faq#how-promotion-work">{i18next.t("entry-list-item.promoted")}</a>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="item-body">
        <EntryListItemNsfwContent entry={entryProp} />
        <EntryListItemMutedContent entry={entryProp} />
      </div>
      <div>
        <div className="w-auto inline-flex items-center gap-2 md:gap-3 rounded-xl border border-[--border-color] px-2 py-1 text-sm">
          <EntryVoteBtn isPostSlider={true} entry={entry} account={account} />
          <EntryPayout entry={entry} />
          <div className="border-r border-[--border-color] w-[1px] h-4" />
          <EntryVotes entry={entry} />
          {(entry.children > 0 || entryProp.children > 0) && (
            <a
              title={
                entry.children > 0
                  ? entry.children === 1
                    ? i18next.t("entry-list-item.replies")
                    : i18next.t("entry-list-item.replies-n", { n: entry.children })
                  : i18next.t("entry-list-item.no-replies")
              }
              className="flex items-center gap-1 text-gray-steel hover:text-blue-dark-sky"
              href={makeEntryPath(entry.category, entry.author, entry.permlink)}
            >
              <UilComment className="w-3.5 h-3.5" /> {entry.children}
            </a>
          )}
          <EntryReblogBtn entry={entry} />
          <div className="border-r border-[--border-color] w-[1px] h-4" />
          <EntryMenu alignBottom={order >= 1} entry={entry} />
        </div>
      </div>
    </div>
  );
}

export function EntryListItem(props: Props) {
  return (
    <EntryListItemProvider>
      <EntryListItemComponent {...props} />
    </EntryListItemProvider>
  );
}
