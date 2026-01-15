"use client";

import { useRef, useEffect } from "react";
import { BlogPostItem } from "./blog-post-item";
import { DetectBottom } from "./detect-bottom";
import { InstanceConfigManager, t } from "@/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAccountPostsInfiniteQueryOptions } from "@ecency/sdk";
import clsx from "clsx";

interface Props {
  filter?: string;
  limit?: number;
}

export function BlogPostsList({ filter = "posts", limit = 20 }: Props) {
  const username = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.username
  );
  const listType = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.layout.listType
  );

  const { data, fetchNextPage, isFetching, hasNextPage } = useInfiniteQuery({
    ...getAccountPostsInfiniteQueryOptions(username, filter, limit),
    select: (data) => data.pages.flatMap((page) => page),
  });

  const previousLengthRef = useRef(0);

  useEffect(() => {
    // If data length decreased (e.g., filter changed), reset the ref
    if (data.length < previousLengthRef.current) {
      previousLengthRef.current = 0;
    } else {
      previousLengthRef.current = data.length;
    }
  }, [data.length]);

  return (
    <div
      className={clsx(
        "w-full",
        listType === "list" && "flex flex-col gap-4",
        listType === "grid" &&
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      )}
    >
      {data.length === 0 && !isFetching && (
        <div className="text-center py-12 text-theme-muted">
          {t("noPosts")}
        </div>
      )}

      {data.map((post, index) => {
        const isNewItem = index >= previousLengthRef.current;
        const batchIndex = isNewItem ? index - previousLengthRef.current : 0;
        return (
          <BlogPostItem
            key={`${post.author}/${post.permlink}`}
            entry={post}
            index={batchIndex}
          />
        );
      })}

      {hasNextPage && <DetectBottom onBottom={() => fetchNextPage()} />}

      {isFetching && (
        <div className="text-center py-8 text-theme-muted">
          {t("loadingMore")}
        </div>
      )}
    </div>
  );
}
