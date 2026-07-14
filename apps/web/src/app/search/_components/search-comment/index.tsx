import React, { Fragment, useMemo, useState } from "react";
import numeral from "numeral";
import dayjs, { Dayjs } from "@/utils/dayjs";
import "./_index.scss";
import { DetectBottom, LinearProgress, SearchListItem } from "@/features/shared";
import i18next from "i18next";
import { SearchAdvancedForm } from "@/app/search/_components/search-advanced-form";
import { getSearchApiInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { SearchResult } from "@/entities";
import { Button } from "@/features/ui";
import { DateOpt } from "@/enums";
import { SearchSort } from "@/app/decks/_components/consts";
import { useBottomPagination } from "@/core/hooks";

interface Props {
  disableResults?: boolean;
}

export function SearchComment({ disableResults }: Props) {
  const [advanced, setAdvanced] = useState(false);

  const params = useSearchParams();

  const since = useMemo(() => {
    let sinceDate: Dayjs | undefined;
    // Default search path is all-time on purpose. Only honor an explicit date
    // from the URL (set by the advanced form) — not a stale localStorage value,
    // which would otherwise pin existing users to the old "last year" default.
    const dateOpt = params?.get("date") ?? DateOpt.A;
    switch (dateOpt) {
      case DateOpt.W:
        sinceDate = dayjs().subtract(1, "week");
        break;
      case DateOpt.M:
        sinceDate = dayjs().subtract(1, "month");
        break;
      case DateOpt.Y:
        sinceDate = dayjs().subtract(1, "year");
        break;
      default:
        sinceDate = undefined;
    }

    return sinceDate?.format("YYYY-MM-DDTHH:mm:ss");
  }, [params]);

  const {
    data: resultsPages,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage
  } = useInfiniteQuery({
    ...getSearchApiInfiniteQueryOptions(
      params?.get("q") ?? "",
      params?.get("sort") ?? SearchSort.RELEVANCE,
      params?.get("hd") !== "0",
      since,
      undefined,
      params?.get("nsfw") === "1" || undefined
    ),
    initialData: { pages: [], pageParams: [] }
  });
  const results = useMemo(
    () =>
      resultsPages?.pages?.reduce<SearchResult[]>((acc, page) => [...acc, ...page.results], []) ??
      [],
    [resultsPages]
  );

  // initialData seeds this query as "success" with zero pages, so the bottom
  // sentinel is also what bootstraps page 1 — see useBottomPagination.
  const onBottom = useBottomPagination({
    data: resultsPages,
    hasNextPage,
    isFetching,
    fetchNextPage
  });
  const hits = useMemo(
    () => resultsPages?.pages?.[resultsPages?.pages?.length - 1]?.hits ?? 0,
    [resultsPages?.pages]
  );

  return (
    <div className="border dark:border-dark-400 overflow-hidden bg-white rounded search-comment">
      <div className="bg-gray-100 dark:bg-dark-200 border-b dark:border-dark-400 p-3 flex justify-between items-center">
        <div>
          <strong>{i18next.t("search-comment.title")}</strong>
          {(() => {
            if (hits === 1) {
              return (
                <span className="matches">{i18next.t("search-comment.matches-singular")}</span>
              );
            }

            if (hits > 1) {
              const strHits = numeral(hits).format("0,0");
              return (
                <span className="text-sm text-gray-600 pl-3">
                  {i18next.t("search-comment.matches", { n: strHits })}
                </span>
              );
            }

            return null;
          })()}
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setAdvanced(!advanced);
          }}
        >
          {advanced ? i18next.t("g.close") : i18next.t("search-comment.advanced")}
        </a>
      </div>
      <div className="p-4">
        {advanced && <SearchAdvancedForm />}
        {(() => {
          if (results.length > 0 && !disableResults) {
            return (
              <div className="search-list">
                {results.map((res) => (
                  <Fragment key={`${res.author}-${res.permlink}`}>
                    <SearchListItem res={res} />
                  </Fragment>
                ))}

                {hasNextPage && (
                  <div className="flex justify-center capitalize">
                    <Button outline={true} disabled={isFetching} onClick={onBottom}>
                      {i18next.t("search-comment.show-more")}
                    </Button>
                  </div>
                )}
              </div>
            );
          }

          if (!isLoading) {
            return <span>{i18next.t("g.no-matches")}</span>;
          }

          return null;
        })()}

        {!disableResults && isLoading && <LinearProgress />}
      </div>
      <DetectBottom onBottom={onBottom} />
    </div>
  );
}
