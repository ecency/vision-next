import React, { useMemo } from "react";
import { Button } from "@ui/button";
import { useGlobalStore } from "@/core/global-store";
import { LoginRequired } from "@/features/shared";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { useAddFavourite, useDeleteFavourite } from "@/api/mutations";
import { useFavouritesQuery } from "@/api/queries";
import { UilHeart } from "@tooni/iconscout-unicons-react";

interface Props {
  targetUsername: string;
}

export function FavouriteBtn({ targetUsername }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data, isPending } = useFavouritesQuery();

  const { mutateAsync: add, isPending: isAddPending } = useAddFavourite(() => {});
  const { mutateAsync: deleteFrom, isPending: isDeletePending } = useDeleteFavourite(() => {});

  const favourited = useMemo(
    () => data?.some((item) => item.account === targetUsername),
    [data, targetUsername]
  );

  const inProgress = useMemo(
    () => isAddPending || isDeletePending || isPending,
    [isAddPending, isDeletePending, isPending]
  );

  return (
    <>
      {!activeUser && (
        <LoginRequired>
          <span className="favorite-btn">
            <Tooltip content={i18next.t("favorite-btn.add")}>
              <Button
                size="sm"
                isLoading={inProgress}
                onClick={() => deleteFrom({ account: targetUsername })}
                icon={<UilHeart />}
              />
            </Tooltip>
          </span>
        </LoginRequired>
      )}
      {activeUser && (
        <Tooltip content={i18next.t(favourited ? "favorite-btn.delete" : "favorite-btn.add")}>
          <Button
            appearance={favourited ? "pressed" : "primary"}
            size="sm"
            noPadding={true}
            className="w-8"
            isLoading={inProgress}
            onClick={() =>
              favourited
                ? deleteFrom({ account: targetUsername })
                : add({ account: targetUsername })
            }
            icon={<UilHeart />}
          />
        </Tooltip>
      )}
    </>
  );
}
