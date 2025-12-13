"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { TagLink } from "@/features/shared/tag";
import { getTrendingTagsQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { UilMultiply } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useParams, useRouter } from "next/navigation";
import { Fragment, useCallback, useMemo } from "react";
import "./_index.scss";

export function TrendingTagsCard() {
  const router = useRouter();
  const params = useParams<{ sections: string[] }>();
  let filter = "hot";
  let tag = "";

  if (params && params.sections) {
    [filter = "hot", tag = ""] = params.sections;
  }

  const { activeUser } = useActiveAccount();

  const { data: trendingTagsPages } = useInfiniteQuery(getTrendingTagsQueryOptions(250));
  const trendingTags = useMemo(() => trendingTagsPages?.pages[0], [trendingTagsPages?.pages]);

  const handleUnselection = useCallback(() => {
    router.push("/" + filter + ((activeUser && activeUser.username && "/my") || ""));
  }, [activeUser, filter, router]);

  return (
    <div className="trending-tags-card">
      <h2 className="list-header">{i18next.t("trending-tags.title")}</h2>

      <div className="flex flex-wrap gap-2">
        {trendingTags?.slice(0, 30).map((t) => (
          <Fragment key={t}>
            <div className="flex">
              <TagLink tag={t} type="link">
                <>
                  {t}
                  {tag === t && (
                    <div
                      className="text-gray-600 flex dark:text-gray-400 ml-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleUnselection();
                      }}
                    >
                      <UilMultiply size="14" />
                    </div>
                  )}
                </>
              </TagLink>
            </div>
          </Fragment>
        ))}
        {trendingTags?.length === 0 &&
          Array.from(new Array(30).keys()).map((i) => (
            <div
              className="animate-pulse rounded-full h-[22px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey"
              key={i}
              style={{
                width: 64 + (i % 3) * 10
              }}
            />
          ))}
      </div>
    </div>
  );
}
