import { error, ProfileLink, success, UserAvatar } from "@/features/shared";
import { Button } from "@ui/button";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import React, { useCallback } from "react";
import { Favorite } from "@/entities";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getAccountFullQueryOptions, useAccountFavouriteDelete } from "@ecency/sdk";
import { useClientActiveUser } from "@/api/queries";
import i18next from "i18next";

interface Props {
  item: Favorite;
  onHide: () => void;
  i: number;
}

export function FavouriteItem({ item, onHide, i }: Props) {
  const activeUser = useClientActiveUser();

  const { data: account } = useQuery(getAccountFullQueryOptions(item.account));
  const { mutateAsync: removeFromFavourites, isPending: isDeletePending } =
    useAccountFavouriteDelete(
      activeUser?.username,
      () => success(i18next.t("favorite-btn.deleted")),
      () => error(i18next.t("g.server-error"))
    );

  const remove = useCallback(
    (e: React.MouseEvent, item: Favorite) => {
      e.stopPropagation();
      e.preventDefault();
      removeFromFavourites(item.account);
    },
    [removeFromFavourites]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2, delay: 0.1 * i }}
    >
      <ProfileLink key={item._id} username={item.account} afterClick={onHide}>
        <div className="bg-white rounded-lg border border-[--border-color] p-2 md:p-4 flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <UserAvatar username={item.account} size="medium" />
            <div className="flex flex-col">
              <span className="font-bold notranslate">
                {account?.profile?.name ?? item.account}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 notranslate">
                {item.account}
              </span>
            </div>
          </div>
          <Button
            icon={<UilTrash />}
            appearance="gray-link"
            size="sm"
            isLoading={isDeletePending}
            onClick={(e: React.MouseEvent<Element, MouseEvent>) => remove(e, item)}
          />
        </div>
      </ProfileLink>
    </motion.div>
  );
}
