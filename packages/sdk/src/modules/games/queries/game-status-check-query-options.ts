import { CONFIG, getBoundFetch } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { GetGameStatus } from "../types";

export function getGameStatusCheckQueryOptions(
  username: string | undefined,
  code: string | undefined,
  gameType: "spin"
) {
  return queryOptions({
    queryKey: ["games", "status-check", gameType, username],
    enabled: !!username && !!code,
    queryFn: async () => {
      if (!username || !code) {
        throw new Error("[SDK][Games] – missing auth");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/get-game",
        {
          method: "POST",
          body: JSON.stringify({
            game_type: gameType,
            code,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return (await response.json()) as GetGameStatus;
    },
  });
}
