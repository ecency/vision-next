import { CONFIG, getBoundFetch, getQueryClient, QueryKeys } from "@/modules/core";
import { useMutation, InfiniteData } from "@tanstack/react-query";
import { AccountFavorite } from "../../types";
import { WrappedResponse } from "@/modules/core/types";

export function useAccountFavoriteDelete(
  username: string | undefined,
  code: string | undefined,
  onSuccess: () => void,
  onError: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["accounts", "favorites", "delete", username],
    mutationFn: async (account: string) => {
      if (!username || !code) {
        throw new Error("[SDK][Account][Favorites] – missing auth");
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites-delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account,
            code,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to delete favorite: ${response.status}`);
      }
      return response.json();
    },
    onMutate: async (account: string) => {
      if (!username) {
        return;
      }

      const qc = getQueryClient();
      const listKey = QueryKeys.accounts.favorites(username);
      const infinitePrefix = QueryKeys.accounts.favoritesInfinite(username);
      const checkKey = QueryKeys.accounts.checkFavorite(username, account);

      await Promise.all([
        qc.cancelQueries({ queryKey: listKey }),
        qc.cancelQueries({ queryKey: infinitePrefix }),
        qc.cancelQueries({ queryKey: checkKey }),
      ]);

      const previousList = qc.getQueryData<AccountFavorite[]>(listKey);
      if (previousList) {
        qc.setQueryData<AccountFavorite[]>(
          listKey,
          previousList.filter((f) => f.account !== account)
        );
      }

      const previousCheck = qc.getQueryData<boolean>(checkKey);
      qc.setQueryData<boolean>(checkKey, false);

      const infiniteQueries = qc.getQueriesData<InfiniteData<WrappedResponse<AccountFavorite>>>({
        queryKey: infinitePrefix,
      });
      const previousInfinite = new Map(infiniteQueries);
      for (const [key, data] of infiniteQueries) {
        if (data) {
          qc.setQueryData(key, {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              data: page.data.filter((f) => f.account !== account),
            })),
          });
        }
      }

      return { previousList, previousInfinite, previousCheck };
    },
    onSuccess: (_data, account) => {
      onSuccess();
      const qc = getQueryClient();
      qc.invalidateQueries({ queryKey: QueryKeys.accounts.favorites(username) });
      qc.invalidateQueries({ queryKey: QueryKeys.accounts.favoritesInfinite(username) });
      qc.invalidateQueries({ queryKey: QueryKeys.accounts.checkFavorite(username!, account) });
    },
    onError: (err, account, context) => {
      const qc = getQueryClient();
      if (context?.previousList) {
        qc.setQueryData(QueryKeys.accounts.favorites(username), context.previousList);
      }
      if (context?.previousInfinite) {
        for (const [key, data] of context.previousInfinite) {
          qc.setQueryData(key, data);
        }
      }
      if (context?.previousCheck !== undefined) {
        qc.setQueryData(
          QueryKeys.accounts.checkFavorite(username!, account),
          context.previousCheck
        );
      }
      onError(err);
    },
  });
}
