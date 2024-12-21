import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/utils";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { useGlobalStore } from "@/core/global-store";
import { error, success } from "@/features/shared";
import i18next from "i18next";
import { Favorite } from "@/entities";
import { QueryIdentifiers } from "@/core/react-query";

export function useAddFavourite(onSuccess: () => void) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["favourites-add"],
    mutationFn: async ({ account }: { account: string }) => {
      if (!activeUser) {
        throw new Error("Cannot add to favourite. Active user missed");
      }
      const data = { code: getAccessToken(activeUser.username), account };
      const response = await appAxios.post<Favorite>(apiBase(`/private-api/favorites-add`), data);
      return response.data;
    },
    onSuccess: (created: Favorite) => {
      queryClient.setQueryData<Favorite[]>(
        [QueryIdentifiers.FAVOURITES, activeUser?.username],
        (data) => [...(data ?? []), created]
      );

      success(i18next.t("favorite-btn.added"));
      onSuccess();
    },
    onError: () => error(i18next.t("g.server-error"))
  });
}

export function useCheckFavourite() {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return useMutation({
    mutationKey: ["favourites-check"],
    mutationFn: async ({ account }: { account: string }) => {
      if (!activeUser) {
        return;
      }
      const data = { code: getAccessToken(activeUser.username), account };
      const response = await appAxios.post(apiBase(`/private-api/favorites-check`), data);
      return response.data;
    }
  });
}

export function useDeleteFavourite(onSuccess: () => void) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["favourites-delete"],
    mutationFn: async ({ account }: { account: string }) => {
      if (!activeUser) {
        throw new Error("Cannot delete favourite. Active user missed");
      }
      const data = { code: getAccessToken(activeUser.username), account };
      await appAxios.post(apiBase(`/private-api/favorites-delete`), data);
      return account;
    },
    onSuccess: (account) => {
      queryClient.setQueryData<Favorite[]>(
        [QueryIdentifiers.FAVOURITES, activeUser?.username],
        (data) => data?.filter((item) => item.account !== account) ?? []
      );
      success(i18next.t("favorite-btn.deleted"));
      onSuccess();
    },
    onError: () => error(i18next.t("g.server-error"))
  });
}
