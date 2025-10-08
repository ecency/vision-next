import { useClientActiveUser } from "@/api/queries";
import { LinearProgress } from "@/features/shared";
import { FavouriteItem } from "@/features/shared/bookmarks/favourite-item";
import { getActiveAccountFavouritesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import i18next from "i18next";

interface Props {
  onHide: () => void;
}

export function FavouritesList({ onHide }: Props) {
  const activeUser = useClientActiveUser();

  const { data, isLoading } = useQuery({
    ...getActiveAccountFavouritesQueryOptions(activeUser?.username),
    refetchOnMount: true,
    select: (data) => data?.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)) ?? []
  });

  return (
    <div className="dialog-content">
      {isLoading && <LinearProgress />}
      {data && data.length > 0 && (
        <div className="dialog-list">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {data.map((item, i) => (
                <FavouriteItem i={i} key={item._id} item={item} onHide={onHide} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      {!isLoading && data?.length === 0 && (
        <div className="dialog-list">{i18next.t("g.empty-list")}</div>
      )}
    </div>
  );
}
