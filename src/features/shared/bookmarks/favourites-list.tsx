import { LinearProgress } from "@/features/shared";
import React, { useMemo } from "react";
import { useFavouritesQuery } from "@/api/queries";
import i18next from "i18next";
import { FavouriteItem } from "@/features/shared/bookmarks/favourite-item";
import { AnimatePresence } from "framer-motion";

interface Props {
  onHide: () => void;
}

export function FavouritesList({ onHide }: Props) {
  const { data, isLoading } = useFavouritesQuery();
  const items = useMemo(
    () => data?.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)) ?? [],
    [data]
  );

  return (
    <div className="dialog-content">
      {isLoading && <LinearProgress />}
      {items.length > 0 && (
        <div className="dialog-list">
          <div className="dialog-list-body">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <FavouriteItem i={i} key={item._id} item={item} onHide={onHide} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      {!isLoading && items.length === 0 && (
        <div className="dialog-list">{i18next.t("g.empty-list")}</div>
      )}
    </div>
  );
}
