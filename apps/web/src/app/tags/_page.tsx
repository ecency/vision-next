"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getTrendingTagsWithStatsQueryOptions } from "@ecency/sdk";
import { LinearProgress, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { Table, Td, Th, Tr } from "@ui/table";
import { Button } from "@ui/button";
import i18next from "i18next";
import Link from "next/link";
import React, { useMemo } from "react";
import "./_page.scss";

export function TagsPage() {
  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery(getTrendingTagsWithStatsQueryOptions());

  const tags = useMemo(() => data?.pages.flat() ?? [], [data]);

  return (
    <>
      <ScrollToTop />
      <Theme />
      <Navbar />
      <div className="app-content tags-page">
        <header className="page-header">
          <h1 className="header-title">{i18next.t("tags-page.title")}</h1>
          <p className="header-description">
            {i18next.t("tags-page.description")}
          </p>
        </header>
        {isPending && <LinearProgress />}
        {isError && (
          <div className="tags-empty-state">
            <span>{i18next.t("tags-page.error")}</span>
          </div>
        )}
        {!isPending && !isError && (
          <>
            <div className="tags-table">
              <Table full={true}>
                <thead>
                  <Tr>
                    <Th className="border p-2 col-rank">#</Th>
                    <Th className="border p-2">{i18next.t("tags-page.columns.tag")}</Th>
                    <Th className="border p-2 col-comments">
                      {i18next.t("tags-page.columns.comments")}
                    </Th>
                    <Th className="border p-2 col-top-posts">
                      {i18next.t("tags-page.columns.top-posts")}
                    </Th>
                    <Th className="border p-2 col-payouts">
                      {i18next.t("tags-page.columns.total-payouts")}
                    </Th>
                  </Tr>
                </thead>
                <tbody>
                  {tags.map((tag, index) => (
                    <Tr key={`${tag.name}-${index}`}>
                      <Td className="border p-2">
                        <span className="tag-rank">{index + 1}</span>
                      </Td>
                      <Td className="border p-2">
                        <Link className="tag-link" href={`/created/${tag.name}`}>
                          {tag.name}
                        </Link>
                      </Td>
                      <Td className="border p-2">
                        <span className="tag-metric">{tag.comments.toLocaleString()}</span>
                      </Td>
                      <Td className="border p-2">
                        <span className="tag-metric">{tag.top_posts.toLocaleString()}</span>
                      </Td>
                      <Td className="border p-2">
                        <span className="tag-metric">{tag.total_payouts}</span>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="tags-table-actions">
              <Button
                appearance="primary"
                disabled={!hasNextPage || isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage
                  ? i18next.t("tags-page.load-more.loading")
                  : hasNextPage
                    ? i18next.t("tags-page.load-more.cta")
                    : i18next.t("tags-page.load-more.done")}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
