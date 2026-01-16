"use client";

import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { SimilarEntries } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/similar-entries";
import defaults from "@/defaults";
import { EditHistory, LinearProgress, Navbar, ScrollToTop, StaticNavbar, Theme } from "@/features/shared";
import { renderPostBody, setProxyBase } from "@ecency/render-helper";
import { getDeletedEntryQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useContext } from "react";

interface Props {
  staticNav?: boolean;
  username: string;
  permlink: string;
}
setProxyBase(defaults.imageServer);
export const DeletedPostScreen = ({ username, permlink, staticNav }: Props) => {
  const { editHistory, setEditHistory } = useContext(EntryPageContext);
  const { data: deletedEntry, isLoading, isError } = useQuery(getDeletedEntryQueryOptions(username, permlink));

  const cleanUsername = username.replace("@", "");

  return (
    <div>
      {staticNav ? <StaticNavbar fullVersionUrl="" /> : <Navbar />}
      <div className="container overflow-x-hidden">
        <ScrollToTop />
        <Theme />
        {isLoading && (
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-9">
              <div className="p-0 p-lg-5 the-entry">
                <LinearProgress />
              </div>
            </div>
          </div>
        )}
        {!isLoading && (isError || !deletedEntry || !deletedEntry.body) && (
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-9">
              <div className="p-0 p-lg-5 the-entry">
                <div className="p-3 bg-danger rounded text-white my-0 mb-4 my-lg-5">
                  {i18next.t("entry.deleted-content", { author: `@${cleanUsername}` })}
                </div>
                <div className="p-3 bg-gray-200 dark:bg-dark-200 rounded my-3">
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    {i18next.t("entry.deleted-no-history")}
                  </p>
                </div>
                {editHistory && (
                  <EditHistory
                    entry={
                      {
                        author: cleanUsername,
                        permlink
                      } as any
                    }
                    onHide={() => setEditHistory(!editHistory)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        {!isLoading && deletedEntry && deletedEntry.body && (
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-9">
              <div className="p-0 p-lg-5 the-entry">
                <div className="p-3 bg-danger rounded text-white my-0 mb-4 my-lg-5">
                  {i18next.t("entry.deleted-content-warning")}
                  <u
                    onClick={() => setEditHistory(!editHistory)}
                    className="text-blue-dark-sky pointer"
                  >
                    {i18next.t("points.history")}
                  </u>{" "}
                  {i18next.t("g.logs")}.
                </div>
                <div className="cross-post">
                  <h1 className="entry-title">{deletedEntry.title || i18next.t("entry.untitled")}</h1>
                </div>
                <div dangerouslySetInnerHTML={{ __html: renderPostBody(deletedEntry.body) }} />
                {editHistory && (
                  <EditHistory
                    entry={
                      {
                        author: cleanUsername,
                        permlink
                      } as any
                    }
                    onHide={() => setEditHistory(!editHistory)}
                  />
                )}
                <div className="mt-3">
                  <SimilarEntries
                    entry={
                      {
                        permlink,
                        author: cleanUsername,
                        json_metadata: { tags: deletedEntry.tags }
                      } as any
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
