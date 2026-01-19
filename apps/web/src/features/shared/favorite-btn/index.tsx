import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, LoginRequired, success } from "@/features/shared";
import {
  getFavouritesQueryOptions,
  useAccountFavouriteAdd,
  useAccountFavouriteDelete
} from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilHeart } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { useMemo } from "react";
import { getAccessToken } from "@/utils";

interface Props {
  targetUsername: string;
}

export function FavouriteBtn({ targetUsername }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const accessToken = useMemo(
    () => (username ? getAccessToken(username) : undefined),
    [username]
  );

  const { data, isPending } = useQuery({
    ...getFavouritesQueryOptions(username, accessToken),
    enabled: !!username && !!accessToken,
  });

  const { mutateAsync: add, isPending: isAddPending } = useAccountFavouriteAdd(
    username,
    accessToken,
    () => success(i18next.t("favorite-btn.added")),
    () => error(i18next.t("g.server-error"))
  );
  const { mutateAsync: deleteFrom, isPending: isDeletePending } = useAccountFavouriteDelete(
    username,
    accessToken,
    () => success(i18next.t("favorite-btn.deleted")),
    () => error(i18next.t("g.server-error"))
  );

  const favourited = useMemo(
    () => data?.some((item) => item.account === targetUsername),
    [data, targetUsername]
  );

  const inProgress = useMemo(
    () => isAddPending || isDeletePending || isPending,
    [isAddPending, isDeletePending, isPending]
  );
  const canMutate = !!accessToken;

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
      {activeUser && !accessToken && (
        <Tooltip content={i18next.t("favorite-btn.add")}>
          <Button
            appearance="primary"
            size="sm"
            noPadding={true}
            className="w-8"
            disabled={true}
            icon={<UilHeart />}
          />
        </Tooltip>
      )}
      {activeUser && accessToken && (
        <Tooltip content={i18next.t(favourited ? "favorite-btn.delete" : "favorite-btn.add")}>
          <Button
            appearance={favourited ? "pressed" : "primary"}
            size="sm"
            noPadding={true}
            className="w-8"
            isLoading={inProgress}
            onClick={() => (favourited ? deleteFrom(targetUsername) : add(targetUsername))}
            icon={<UilHeart />}
          />
        </Tooltip>
      )}
    </>
  );
}
