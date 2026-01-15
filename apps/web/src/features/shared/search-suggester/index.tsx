"use client";

import { useDataLimit } from "@/utils/data-limit";
import { getAccountReputationsQueryOptions } from "@ecency/sdk";
import defaults from "@/defaults";
import { Community, Reputations } from "@/entities";
import { SuggestionList, UserAvatar } from "@/features/shared";
import { accountReputation } from "@/utils";
import { getCommunitiesQueryOptions, getTrendingTagsQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/badge";
import i18next from "i18next";
import { usePathname, useRouter } from "next/navigation";
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce, usePrevious } from "react-use";
import { makePathProfile } from "../profile-link";
import { makePathTag } from "../tag";

export interface SuggestionGroup<T = any> {
  header?: string;
  items: T[];
  renderer?: (item: T) => React.ReactNode;
  onSelect?: (item: T) => void;
}

interface Props {
  value: string;
  children: ReactElement;
  containerClassName?: string;
  changed: boolean;
  extraSuggestions?: (value: string) => SuggestionGroup[];
}

export function SearchSuggester({
  changed,
  value,
  children,
  containerClassName,
  extraSuggestions
}: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const previousPathname = usePrevious(pathname);
  const previousValue = usePrevious(value);
  const dataLimit = useDataLimit();

  const [suggestions, setSuggestions] = useState<string[] | Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [_, setMode] = useState("");
  const [suggestionWithMode, setSuggestionWithMode] = useState<SuggestionGroup[]>([]);

  const { data: trendingTagsPages } = useInfiniteQuery(getTrendingTagsQueryOptions(250));
  const trendingTags = useMemo(() => trendingTagsPages?.pages[0] ?? [], [trendingTagsPages?.pages]);

  useEffect(() => {
    if (previousPathname !== pathname) {
      setSuggestions([]);
      setLoading(false);
      setMode("");
    }
  }, [pathname, previousPathname]);

  useDebounce(
    () => {
      if (value !== previousValue && changed) {
      }
    },
    1000,
    [value, previousValue]
  );

  const accountSelected = useCallback(
    (name: string) => {
      const loc = makePathProfile(name);
      router.push(loc);
    },
    [router]
  );

  const tagSelected = useCallback(
    (tag: string) => {
      const loc = makePathTag(defaults.filter, tag);
      router.push(loc);
    },
    [router]
  );

  const communitySelected = useCallback(
    (item: Community) => {
      const loc = makePathTag(defaults.filter, item.name);
      router.push(loc);
    },
    [router]
  );

  const fetch = useCallback(async () => {
    if (loading) {
      return;
    }

    const extraSuggestionGroups = extraSuggestions?.(value) ?? [];

    const applySuggestionGroups = (
      groups: SuggestionGroup[],
      suggestionItems: string[] | Community[] = []
    ) => {
      const combinedGroups = [...extraSuggestionGroups, ...groups];

      if (combinedGroups.length > 0) {
        setSuggestionWithMode(combinedGroups);
        setSuggestions(suggestionItems);
        return true;
      }

      setSuggestionWithMode([]);
      setSuggestions([]);
      return false;
    };

    // # Tags
    if (value.startsWith("#")) {
      const tag = value.replace("#", "");
      const suggestions = trendingTags
        .filter((x: string) => x.toLowerCase().indexOf(tag.toLowerCase()) === 0)
        .filter((x: string) => x.indexOf("hive-") === -1)
        .map((x) => `#${x}`)
        .slice(0, 20);

      const suggestionWithMode = [
        {
          header: i18next.t("search.header-tag"),
          onSelect: (i: string) => {
            tagSelected(i.replace("#", ""));
          },
          items: suggestions
        }
      ];
      setMode("tag");
      applySuggestionGroups(suggestionWithMode, suggestions);
      return;
    }

    // Account
    if (value.startsWith("@")) {
      const name = value.replace("@", "");
      setLoading(true);
      try {
        const r = await queryClient.fetchQuery(
          getAccountReputationsQueryOptions(name, 20)
        );
        const validReputations = r || [];
        validReputations.sort((a, b) => (a.reputation > b.reputation ? -1 : 1));
        const suggestions = validReputations.map((x) => `${x.account}`);
        const suggestionWithMode = [
          {
            header: i18next.t("search.header-account"),
            renderer: (i: Reputations) => {
              return (
                <>
                  <UserAvatar username={i.account} size="medium" />
                  <span style={{ marginLeft: "8px" }}>{i.account}</span>
                  <span style={{ marginLeft: "8px" }}>({accountReputation(i.reputation)})</span>
                </>
              );
            },
            onSelect: (i: Reputations) => accountSelected(i.account),
            items: validReputations
          }
        ];
        setMode("account");
        setSuggestions(suggestions);
        applySuggestionGroups(suggestionWithMode, suggestions);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Community
    if (value.startsWith("$")) {
      const q = value.replace("$", "");
      try {
        const r = await queryClient.fetchQuery(
          getCommunitiesQueryOptions("rank", q, dataLimit)
        );
        if (r) {
          const suggestionWithMode = [
            {
              header: i18next.t("search.header-community"),
              renderer: (i: Community) => i.title,
              onSelect: (i: Community) => communitySelected(i),
              items: r
            }
          ];
          setMode("comm");
          setSuggestions(r);
          applySuggestionGroups(suggestionWithMode, r);
        }
      } catch (e) {
        setLoading(false);
      }
      return;
    }

    // Search ALL
    if (!!value) {
      try {
        // tags
        const tags_suggestions = trendingTags
          .filter((x: string) => x.toLowerCase().indexOf(value.toLowerCase()) === 0)
          .filter((x: string) => x.indexOf("hive-") === -1)
          .map((x) => `#${x}`)
          .slice(0, 2);
        // account
        const lookup_accounts = await queryClient.fetchQuery(
          getAccountReputationsQueryOptions(value, 20)
        );
        const accountsug = (lookup_accounts || [])
          .sort((a, b) => (a.reputation > b.reputation ? -1 : 1))
          .slice(0, 3);
        // Community
        const get_communities = await queryClient.fetchQuery(
          getCommunitiesQueryOptions("rank", value, 2)
        );
        const communities_suggestions = get_communities || [];
        const suggestionWithMode = [
          {
            header: i18next.t("search.header-tag"),
            onSelect: (i: string) => tagSelected(i.replace("#", "")),
            items: tags_suggestions
          },
          {
            header: i18next.t("search.header-account"),
            renderer: (i: Reputations) => {
              return (
                <>
                  <UserAvatar username={i.account} size="medium" />
                  <span className="mx-2">{i.account}</span>
                  <Badge>{accountReputation(i.reputation)}</Badge>
                </>
              );
            },
            onSelect: (i: Reputations) => accountSelected(i.account),
            items: accountsug
          },
          {
            header: i18next.t("search.header-community"),
            renderer: (i: Community) => {
              return i.title;
            },
            onSelect: (i: Community) => communitySelected(i),
            items: communities_suggestions
          }
        ];
        setMode("all");
        applySuggestionGroups(suggestionWithMode);
      } finally {
        setLoading(false);
      }
    } else {
      if (extraSuggestionGroups.length > 0) {
        setMode("custom");
        setSuggestionWithMode(extraSuggestionGroups);
        setSuggestions([]);
      } else {
        setMode("");
        setSuggestionWithMode([]);
        setSuggestions([]);
      }
    }
  }, [
    accountSelected,
    communitySelected,
    extraSuggestions,
    loading,
    queryClient,
    tagSelected,
    trendingTags,
    dataLimit,
    value
  ]);

  useEffect(() => {
    if (value !== previousValue && changed) {
      fetch();
    }
  }, [value, previousValue, changed, fetch]);

  return (
    <SuggestionList
      searchValue={value}
      items={suggestions}
      modeItems={suggestionWithMode}
      containerClassName={containerClassName}
    >
      {children}
    </SuggestionList>
  );
}
