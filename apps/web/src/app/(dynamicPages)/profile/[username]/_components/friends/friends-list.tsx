import { useMemo, useState } from "react";
import { getFriendsInfiniteQueryOptions, getSearchFriendsQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Account } from "@/entities";
import { Button } from "@ui/button";
import i18next from "i18next";
import { FormControl, InputGroup } from "@ui/input";
import { Spinner } from "@ui/spinner";
import { LinearProgress } from "@/features/shared";
import dayjs from "@/utils/dayjs";
import { FilterFriendsType } from "@/enums";
import { FilterFriends } from "./filter-friends";
import { useDebounce } from "react-use";
import { FriendListItem } from "@/app/(dynamicPages)/profile/[username]/_components/friends/friend-list-item";
import { AnimatePresence, motion } from "framer-motion";
import type { Friend } from "./types";

const loadLimit = 30;

interface Props {
  account: Account;
  mode: "following" | "followers";
}

export const FriendsList = ({ account, mode }: Props) => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<FilterFriendsType>();

  const {
    data,
    isFetching: isFriendsFetching,
    fetchNextPage
  } = useInfiniteQuery(
    getFriendsInfiniteQueryOptions(account.name, mode, {
      limit: loadLimit
    })
  );
  const {
    data: searchData,
    isFetching: isSearchFetching,
    refetch: fetchSearchResults
  } = useQuery(
    getSearchFriendsQueryOptions(account.name, mode, query)
  );

  const isFetching = useMemo(
    () => isFriendsFetching || isSearchFetching,
    [isFriendsFetching, isSearchFetching]
  );

  const dataFlow = useMemo((): Friend[] => {
    const rawItems = query
      ? searchData ?? []
      : data?.pages?.flat() ?? [];

    const filtered = rawItems.filter((item) => {
      if (!type) return true;

      const lastSeenTime = dayjs(item.active).toDate();
      const timeDifference = new Date().getTime() - lastSeenTime.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
      const yearsDifference = Math.ceil(daysDifference / 365);

      return (
        (type === FilterFriendsType.Recently && daysDifference < 7) ||
        (type === FilterFriendsType.ThisMonth &&
          daysDifference > 7 &&
          daysDifference < 30) ||
        (type === FilterFriendsType.ThisYear &&
          daysDifference >= 30 &&
          daysDifference < 360) ||
        (type === FilterFriendsType.OneYear && daysDifference === 365) ||
        (type === FilterFriendsType.MoreThanOneYear && yearsDifference > 1)
      );
    });

    return filtered.map((item) => ({
      name: item.name,
      reputation: item.reputation,
      lastSeen: dayjs(item.active).fromNow()
    }));
  }, [data?.pages, query, searchData, type]);

  const hasMore = useMemo(
    () => (data?.pages?.[data.pages.length - 1]?.length ?? 0) >= loadLimit,
    [data?.pages]
  );

  useDebounce(
    () => {
      if (query) {
        fetchSearchResults();
      }
    },
    2000,
    [query, fetchSearchResults]
  );

  return (
    <div className="friends-content">
      <div>
        <FilterFriends updateFilterType={(v) => setType(v)} />
      </div>

      {isFetching && dataFlow.length === 0 && <LinearProgress />}

      <div className="friends-list">
        <div className="friend-search-box">
          <InputGroup prepend={isFetching ? <Spinner className="w-3.5 h-3.5" /> : "@"}>
            <FormControl
              type="text"
              value={query}
              placeholder={i18next.t("friends.search-placeholder")}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.keyCode === 13) {
                  fetchSearchResults();
                }
              }}
            />
          </InputGroup>
        </div>

        <div className="list-body">
          {!isFetching && dataFlow?.length === 0 && (
            <div className="empty-list"> {i18next.t("g.empty-list")}</div>
          )}

          <AnimatePresence>
            {dataFlow?.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 32 }}
                transition={{ delay: i * 0.1 }}
              >
                <FriendListItem item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {isFetching && dataFlow.length > 0 && <LinearProgress />}

      {!query && dataFlow.length > 1 && (
        <div className="load-more">
          <Button disabled={isFetching || !hasMore} onClick={() => fetchNextPage()}>
            {i18next.t("g.load-more")}
          </Button>
        </div>
      )}
    </div>
  );
};
