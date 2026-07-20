import { EntryPageMainInfoMenu } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-main-info-menu";
import { EcencyConfigManager } from "@/config";
import { Entry } from "@/entities";
import {
  BookmarkBtn,
  EntryStats,
  ProfileLink,
  TagLink,
  TimeLabel,
  UserAvatar
} from "@/features/shared";
import { ProBadge } from "@/features/pro";
import { accountReputation } from "@/utils";
import i18next from "i18next";
import { EntryPageListen } from "./entry-page-listen";

interface Props {
  entry: Entry;
}

export function EntryPageMainInfo({ entry }: Props) {
  const isComment = !!entry.parent_author;

  const reputation = accountReputation(entry.author_reputation ?? 0);

  return (
    <div className=" bg-white/80 dark:bg-dark-200/90 rounded-xl flex flex-col mb-4 md:mb-6 lg:mb-8 mt-2 lg:mt-4">
      {!isComment && (
        <h1 className="px-3 md:px-4 pt-3 md:pt-4 pb-1 text-2xl md:text-[30px] lg:text-[38px] font-semibold !leading-[1.25] break-words !font-[var(--font-lora)]">
          {entry.title}
        </h1>
      )}
      <div className="p-2 md:p-3 grid grid-cols-1 sm:grid-cols-[1fr_max-content] w-full items-end gap-2">
        <div className="flex items-center gap-2 md:gap-3 truncate overflow-hidden">
          <ProfileLink username={entry.author}>
            <UserAvatar username={entry.author} size="sLarge" />
          </ProfileLink>
          <div className="flex flex-col">
            <ProfileLink username={entry.author}>
              <div className="text-lg notranslate">
                <span>{entry.author}</span>
                <span className="author-reputation" title={i18next.t("entry.author-reputation")}>
                  ({reputation})
                </span>
                <ProBadge username={entry.author} className="ml-1" />
              </div>
            </ProfileLink>

            <div className="flex text-sm items-center">
              <div className="in-tag mr-2 opacity-50">{i18next.t("entry.published")}</div>
              <TagLink tag={entry.category} type="link">
                {entry.community ? entry.community_title : `#${entry.category}`}
              </TagLink>
            </div>
          </div>
        </div>

        <EntryPageListen entry={entry} />
      </div>

      <div className="p-2 md:p-3 border-t border-[--border-color] flex items-center justify-between">
        <div className="flex items-center text-sm">
          <span className="separator circle-separator mx-1 lg:hidden" />
          <EntryStats entry={entry} />
          <span className="separator circle-separator mx-1" />
          <TimeLabel created={entry.created} />
        </div>
        <div className="flex items-center justify-end">
          {!isComment && (
            <EcencyConfigManager.Conditional
              condition={({ visionFeatures }) => visionFeatures.bookmarks.enabled}
            >
              <BookmarkBtn entry={entry} />
            </EcencyConfigManager.Conditional>
          )}
          {!isComment && <EntryPageMainInfoMenu entry={entry} />}
        </div>
      </div>
    </div>
  );
}
