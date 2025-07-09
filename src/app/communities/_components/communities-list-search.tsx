"use client";

import { SearchBox } from "@/features/shared";
import { getCommunitiesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useDebounce } from "react-use";

interface Props {
  sort: string;
  query: string;
}

export function CommunitiesListSearch({ sort, query: preQuery }: Props) {
  const router = useRouter();

  const [query, setQuery] = useState(preQuery);
  const [fetchingQuery, setFetchingQuery] = useState("");

  const { isLoading } = useQuery(getCommunitiesQueryOptions(sort, fetchingQuery));

  useDebounce(() => setFetchingQuery(query), 1000, [query]);

  useEffect(() => {
    router.push(`?q=${fetchingQuery}`);
  }, [fetchingQuery, router]);

  return (
    <SearchBox
      placeholder={i18next.t("g.search")}
      value={query}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
      readOnly={isLoading}
    />
  );
}
