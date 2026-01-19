import React, { useEffect, useMemo, useRef, useState } from "react";
import { LinearProgress } from "@/features/shared";
import { FormControl } from "@ui/input";
import { ScheduledListItem } from "@/features/shared/schedules/scheduled-list-item";
import { getSchedulesInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useDeleteSchedule, useMoveSchedule } from "@/api/mutations";
import i18next from "i18next";
import { useMount } from "react-use";
import { getAccessToken } from "@/utils";
import { Button } from "@ui/button";

interface Props {
  onHide: () => void;
}

export function SchedulesList({}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { activeUser } = useActiveAccount();

  const [searchQuery, setSearchQuery] = useState("");

  const {
    data,
    isPending,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    getSchedulesInfiniteQueryOptions(
      activeUser?.username,
      getAccessToken(activeUser?.username ?? ""),
      10
    )
  );

  const allSchedules = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const items = useMemo(
    () =>
      allSchedules
        .filter((x) => x.title.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1)
        .sort((a, b) =>
          new Date(b.schedule).getTime() > new Date(a.schedule).getTime() ? 1 : -1
        ),
    [allSchedules, searchQuery]
  );

  useMount(() => {
    refetch();
  });

  useEffect(() => {
    if (allSchedules && allSchedules.length > 0) {
      inputRef?.current?.focus();
    }
  }, [allSchedules]);

  if (isPending) {
    return <LinearProgress />;
  }

  if (allSchedules.length === 0) {
    return <div className="schedules-list">{i18next.t("g.empty-list")}</div>;
  }

  return (
    <div className="dialog-content">
      <div className="dialog-filter">
        <FormControl
          ref={inputRef}
          type="text"
          placeholder={i18next.t("drafts.filter")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {items.length === 0 && <span className="text-gray-600">{i18next.t("g.no-matches")}</span>}

      {items.length > 0 && (
        <div className="schedules-list">
          <div className="schedules-list-body flex flex-col gap-3 my-4">
            {items.map((item) => (
              <ScheduledListItem key={item._id} post={item} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center my-4">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                isLoading={isFetchingNextPage}
              >
                {isFetchingNextPage ? i18next.t("g.loading") : i18next.t("g.load-more")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
