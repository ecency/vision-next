import { useAddFavourite, useDeleteFavourite } from "@/api/mutations";
import { useClientActiveUser } from "@/api/queries";
import { LoginRequired } from "@/features/shared";
import { getActiveAccountFavouritesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilHeart } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { useMemo } from "react";

interface Props {
  targetUsername: string;
}

export function FavouriteBtn({ targetUsername }: Props) {
  const activeUser = useClientActiveUser();

  const { data, isPending } = useQuery(
    getActiveAccountFavouritesQueryOptions(activeUser?.username)
  );

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
              <Button size="sm" icon={<UilHeart />} />
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
