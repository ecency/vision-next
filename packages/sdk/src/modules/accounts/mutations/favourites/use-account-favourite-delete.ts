import { CONFIG, getBoundFetch, getQueryClient, QueryKeys } from "@/modules/core";
import { useMutation, InfiniteData } from "@tanstack/react-query";
import { AccountFavorite } from "../../types";
import { WrappedResponse } from "@/modules/core/types";

export function useAccountFavouriteDelete(
  username: string | undefined,
  code: string | undefined,
  onSuccess: () => void,
  onError: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["accounts", "favourites", "delete", username],
    mutationFn: async (account: string) => {
      if (!username || !code) {
        throw new Error("[SDK][Account][Favourites] – missing auth");
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
      return response.json();
    },
    onMutate: async (account: string) => {
      const qc = getQueryClient();
      const listKey = QueryKeys.accounts.favourites(username);

      await qc.cancelQueries({ queryKey: listKey });

      const previousList = qc.getQueryData<AccountFavorite[]>(listKey);
      if (previousList) {
        qc.setQueryData<AccountFavorite[]>(
          listKey,
          previousList.filter((f) => f.account !== account)
        );
      }

      // Also update infinite query caches
      const infiniteQueries = qc.getQueriesData<InfiniteData<WrappedResponse<AccountFavorite>>>({
        queryKey: ["accounts", "favourites", "infinite", username],
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

      return { previousList, previousInfinite };
    },
    onSuccess: () => {
      onSuccess();
      getQueryClient().invalidateQueries({
        queryKey: ["accounts", "favourites", username],
      });
    },
    onError: (err, _account, context) => {
      const qc = getQueryClient();
      if (context?.previousList) {
        qc.setQueryData(QueryKeys.accounts.favourites(username), context.previousList);
      }
      if (context?.previousInfinite) {
        for (const [key, data] of context.previousInfinite) {
          qc.setQueryData(key, data);
        }
      }
      onError(err);
    },
  });
}
