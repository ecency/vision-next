import { useActiveAccount } from "@/core/hooks/use-active-account";
import { LinearProgress } from "@/features/shared";
import { FavouriteItem } from "@/features/shared/bookmarks/favourite-item";
import { getActiveAccountFavouritesInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import i18next from "i18next";
import { getAccessToken } from "@/utils";
import { Button } from "@ui/button";
import { useMemo } from "react";

interface Props {
  onHide: () => void;
}

export function FavouritesList({ onHide }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const accessToken = username ? getAccessToken(username) : undefined;

  const {
    data,
    isPending: isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    getActiveAccountFavouritesInfiniteQueryOptions(username, accessToken, 10)
  );

  const allFavourites = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const items = useMemo(
    () => allFavourites.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)),
    [allFavourites]
  );

  return (
    <div className="dialog-content">
      {isLoading && <LinearProgress />}
      {items && items.length > 0 && (
        <div className="dialog-list">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <FavouriteItem i={i} key={item._id} item={item} onHide={onHide} />
              ))}
            </AnimatePresence>
          </div>
          {hasNextPage && (
            <div className="flex justify-center my-4 col-span-full">
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
      {!isLoading && items.length === 0 && (
        <div className="dialog-list">{i18next.t("g.empty-list")}</div>
      )}
    </div>
  );
}
