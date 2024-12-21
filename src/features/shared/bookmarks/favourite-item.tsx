import { ProfileLink, UserAvatar } from "@/features/shared";
import { Button } from "@ui/button";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import React, { useCallback } from "react";
import { Favorite } from "@/entities";
import { useDeleteFavourite } from "@/api/mutations";
import { motion } from "framer-motion";

interface Props {
  item: Favorite;
  onHide: () => void;
  i: number;
}

export function FavouriteItem({ item, onHide, i }: Props) {
  const { mutateAsync: removeFromFavourites, isPending } = useDeleteFavourite(() => {});

  const remove = useCallback(
    (e: React.MouseEvent, item: Favorite) => {
      e.stopPropagation();
      e.preventDefault();
      removeFromFavourites({ account: item.account });
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
        <div className="dialog-list-item">
          <UserAvatar username={item.account} size="medium" />
          <div className="item-body">
            <span className="author notranslate">{item.account}</span>
          </div>
          <Button
            icon={<UilTrash />}
            appearance="gray-link"
            size="sm"
            isLoading={isPending}
            onClick={(e: React.MouseEvent<Element, MouseEvent>) => remove(e, item)}
          />
        </div>
      </ProfileLink>
    </motion.div>
  );
}
