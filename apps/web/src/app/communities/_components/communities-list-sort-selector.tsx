"use client";

import { getCommunitiesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

interface Props {
  sort: string;
  query: string;
}

export function CommunitiesListSortSelector({ sort: preSort, query }: Props) {
  const router = useRouter();

  const [sort, setSort] = useState(preSort);

  const { isLoading } = useQuery(getCommunitiesQueryOptions(sort, query));

  useEffect(() => {
    router.push(`?sort=${sort}`);
  }, [router, sort]);

  return (
    <FormControl
      type="select"
      value={sort}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSort(e.target.value)}
      disabled={isLoading}
    >
      <option value="hot">{i18next.t("communities.sort-hot")}</option>
      <option value="rank">{i18next.t("communities.sort-rank")}</option>
      <option value="subs">{i18next.t("communities.sort-subs")}</option>
      <option value="new">{i18next.t("communities.sort-new")}</option>
    </FormControl>
  );
}
