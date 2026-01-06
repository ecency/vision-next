import React, { useEffect, useMemo, useRef, useState } from "react";
import { LinearProgress } from "@/features/shared";
import { FormControl } from "@ui/input";
import { ScheduledListItem } from "@/features/shared/schedules/scheduled-list-item";
import { getSchedulesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useDeleteSchedule, useMoveSchedule } from "@/api/mutations";
import i18next from "i18next";
import { useMount } from "react-use";

interface Props {
  onHide: () => void;
}

export function SchedulesList({}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { activeUser } = useActiveAccount();

  const [searchQuery, setSearchQuery] = useState("");

  const { data, isPending, refetch } = useQuery(getSchedulesQueryOptions(activeUser?.username));

  const items = useMemo(
    () =>
      data
        ?.filter((x) => x.title.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1)
        .sort((a, b) =>
          new Date(b.schedule).getTime() > new Date(a.schedule).getTime() ? 1 : -1
        ) ?? [],
    [data, searchQuery]
  );

  useMount(() => {
    refetch();
  });

  useEffect(() => {
    if (data && data.length > 0) {
      inputRef?.current?.focus();
    }
  }, [data]);

  if (isPending) {
    return <LinearProgress />;
  }

  if (data?.length === 0) {
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
        </div>
      )}
    </div>
  );
}
