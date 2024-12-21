import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { useGlobalStore } from "@/core/global-store";
import { getAccessToken } from "@/utils";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { Favorite } from "@/entities";

export function useFavouritesQuery() {
  const activeUser = useGlobalStore((state) => state.activeUser);

  return useQuery({
    queryKey: [QueryIdentifiers.FAVOURITES, activeUser?.username],
    queryFn: async () => {
      if (!activeUser) {
        throw new Error("[RemoveFavourite] Active user not found");
      }

      const data = { code: getAccessToken(activeUser.username) };
      const resp = await appAxios.post<Favorite[]>(apiBase(`/private-api/favorites`), data);
      return resp.data;
    },
    enabled: !!activeUser
  });
}
