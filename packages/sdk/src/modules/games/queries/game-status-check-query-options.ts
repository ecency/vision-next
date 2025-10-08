import { CONFIG, getAccessToken } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { GetGameStatus } from "../types";

export function getGameStatusCheckQueryOptions(
  username: string | undefined,
  gameType: "spin"
) {
  return queryOptions({
    queryKey: ["games", "status-check", gameType, username],
    enabled: !!username,
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Games] – anon user in status check");
      }
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/get-game",
        {
          method: "POST",
          body: JSON.stringify({
            game_type: gameType,
            code: getAccessToken(username),
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
