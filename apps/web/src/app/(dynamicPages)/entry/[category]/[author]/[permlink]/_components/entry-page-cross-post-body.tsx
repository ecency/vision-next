import {BookmarkBtn, EntryMenu, ProfileLink, TimeLabel, UserAvatar} from "@/features/shared";
import i18next from "i18next";
import { accountReputation } from "@/utils";
import { Entry } from "@/entities";
import {renderPostBody, setProxyBase} from "@ecency/render-helper";
import { useGlobalStore } from "@/core/global-store";
import { TagLink } from "@/features/shared/tag";
import { EcencyConfigManager } from "@/config";
import React from "react";
import defaults from "@/defaults";

interface Props {
  entry: Entry;
}
setProxyBase(defaults.imageServer);
export function EntryPageCrossPostBody({ entry }: Props) {
  const canUseWebp = useGlobalStore((s) => s.canUseWebp);

  if (!entry.original_entry) {
    return <></>;
  }

  const reputation = accountReputation(entry.original_entry.author_reputation);
  const renderedBody = {
    __html: renderPostBody(entry.original_entry.body, false, canUseWebp)
  };

  return (
    <>
      <div className="entry-header">
        <div className="entry-info">
          <ProfileLink username={entry.original_entry.author}>
            <div className="author-avatar">
              <UserAvatar username={entry.original_entry.author} size="medium" />
            </div>
          </ProfileLink>

          <div className="entry-info-inner">
            <div className="info-line-1">
              <ProfileLink username={entry.original_entry.author}>
                <div className="author notranslate">
                  <span className="author-name">
                    <span itemProp="author" itemScope={true} itemType="http://schema.org/Person">
                      <span itemProp="name">{entry.original_entry.author}</span>
                    </span>
                  </span>
                  <span className="author-reputation" title={i18next.t("entry.author-reputation")}>
                    ({reputation})
                  </span>
                </div>
              </ProfileLink>
            </div>

            <div className="info-line-2">
              <TimeLabel created={entry.original_entry.created} />
              <span className="separator circle-separator" />
              <div className="entry-tag">
                <span className="in-tag mr-2">{i18next.t("entry.published")}</span>
                <TagLink tag={entry.original_entry.category} type="link">
                  <div className="tag-name">
                    {entry.original_entry.community
                      ? entry.original_entry.community_title
                      : `#${entry.original_entry.category}`}
                  </div>
                </TagLink>
              </div>
            </div>
          </div>
          <span className="flex-spacer" />
          <EcencyConfigManager.Conditional
            condition={({ visionFeatures }) => visionFeatures.bookmarks.enabled}
          >
            <BookmarkBtn entry={entry.original_entry} />
          </EcencyConfigManager.Conditional>
          <EntryMenu entry={entry} separatedSharing={true} />
        </div>
      </div>
      <div
        itemProp="articleBody"
        className="entry-body markdown-view user-selectable"
        dangerouslySetInnerHTML={renderedBody}
      />
    </>
  );
}
