"use client";

import { Entry } from "@/entities";
import defaults from "@/defaults";
import { LinearProgress } from "@/features/shared/linear-progress";
import { Navbar } from "@/features/shared/navbar";
import { ProfileLink } from "@/features/shared/profile-link";
import { ScrollToTop } from "@/features/shared/scroll-to-top";
import { Theme } from "@/features/shared/theme";
import { UserAvatar } from "@/features/shared/user-avatar";
import { TagLink } from "@/features/shared/tag";
import { accountReputation } from "@/utils";
import { renderPostBody, setProxyBase } from "@ecency/render-helper";
import i18next from "i18next";

interface Props {
  entry: Entry;
  isTimedOut: boolean;
}

setProxyBase(defaults.imageServer);

export function EntryPendingIndexView({ entry, isTimedOut }: Props) {
  const reputation = accountReputation(entry.author_reputation ?? 0);
  const tags = Array.isArray(entry?.json_metadata?.tags)
    ? Array.from(new Set(entry.json_metadata.tags)).filter(Boolean)
    : [];

  return (
    <div>
      <Navbar />
      <div className="container overflow-x-hidden">
        <ScrollToTop />
        <Theme />
        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-9">
            <div className="p-0 p-lg-5 the-entry">
              {!isTimedOut && (
                <>
                  <div className="p-3 bg-blue-duck-egg dark:bg-blue-dark-sky/20 rounded text-blue-dark-sky my-0 mb-4 my-lg-5">
                    {i18next.t("entry.indexing-blockchain")}
                  </div>
                  <LinearProgress />
                </>
              )}
              {isTimedOut && (
                <div className="p-3 bg-warning-040 dark:bg-warning-030/20 rounded text-gray-charcoal my-0 mb-4 my-lg-5">
                  {i18next.t("entry.indexing-slow")}
                </div>
              )}

              <div className="flex items-center gap-2 md:gap-3 my-4">
                <ProfileLink username={entry.author}>
                  <UserAvatar username={entry.author} size="sLarge" />
                </ProfileLink>
                <div className="flex flex-col">
                  <ProfileLink username={entry.author}>
                    <div className="text-lg notranslate">
                      <span>{entry.author}</span>
                      <span
                        className="author-reputation"
                        title={i18next.t("entry.author-reputation")}
                      >
                        ({reputation})
                      </span>
                    </div>
                  </ProfileLink>
                </div>
              </div>

              <h1 className="px-2 lg:px-0 text-xl sm:text-2xl md:text-[32px] lg:text-[42px] !leading-[1.5] mt-4 mb-6 break-words !font-[var(--font-lora)]">
                {entry.title}
              </h1>

              <div className="bg-white/80 dark:bg-dark-200/90 rounded-xl p-2 md:p-4">
                <div
                  id="post-body"
                  className="entry-body markdown-view user-selectable client"
                  dangerouslySetInnerHTML={{
                    __html: renderPostBody(entry.body, false, false, "ecency.com")
                  }}
                />
              </div>

              {tags.length > 0 && (
                <div className="entry-tags my-4">
                  {tags.map(
                    (t, i) =>
                      typeof t === "string" && (
                        <TagLink key={t + i} tag={t.trim()} type="link">
                          {t}
                        </TagLink>
                      )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
