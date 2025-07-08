import React, { useState } from "react";
import { FormControl } from "@ui/input";
import { CommunitySelectorItem } from "@/app/submit/_components/community-selector/community-selector-item";
import i18next from "i18next";
import { getCommunitiesQuery, useGetSubscriptionsQuery } from "@/api/queries";
import { useDebounce } from "react-use";
import useMount from "react-use/lib/useMount";
import { useGlobalStore } from "@/core/global-store";
import { LinearProgress } from "@/features/shared";

interface BrowserProps {
  onSelect: (name: string | null) => void;
  onHide: () => void;
}

export function CommunitySelectorBrowser({ onSelect, onHide }: BrowserProps) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const {
    data: subscriptions,
    refetch,
    isLoading: isSubsLoading
  } = useGetSubscriptionsQuery(activeUser?.username);

  const [query, setQuery] = useState("");
  const [fetchingQuery, setFetchingQuery] = useState("");

  const { data: results, isLoading } = getCommunitiesQuery(
    "rank",
    fetchingQuery,
    14,
    fetchingQuery !== ""
  ).useClientQuery();

  useMount(() => {
    refetch();
    document.getElementById("search-communities-input")?.focus();
  });

  useDebounce(
    () => {
      setFetchingQuery(query);
    },
    300,
    [query]
  );

  const search = (
    <div className="search">
      <FormControl
        type="text"
        placeholder={i18next.t("community-selector.search-placeholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        id="search-communities-input"
        spellCheck={true}
      />
    </div>
  );

  if (query) {
    return (
      <div className="browser">
        {search}

        <div className="browser-list mt-4">
          {isLoading && <LinearProgress />}
          <div className="flex flex-wrap py-3 gap-3">
            {results?.map((x) => (
              <CommunitySelectorItem
                key={x.id}
                name={x.name}
                title={x.title}
                community={x}
                onSelect={onSelect}
                onHide={onHide}
              />
            ))}
            {results?.length === 0 && <div className="empty-list">{i18next.t("g.empty-list")}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="browser">
      {search}

      <div className="browser-list mt-4">
        {isSubsLoading && <LinearProgress />}
        <div className="flex flex-wrap py-3 gap-3">
          <CommunitySelectorItem
            name={null}
            title={i18next.t("community-selector.my-blog")}
            onSelect={onSelect}
            onHide={onHide}
          />

          {subscriptions?.map((x) => (
            <CommunitySelectorItem
              key={x[0]}
              name={x[0]}
              title={x[1]}
              onSelect={onSelect}
              onHide={onHide}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
