import { CONFIG, getAccessToken } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";
import { GameClaim } from "../types";
import { useRecordActivity } from "@/modules/analytics/mutations";

export function useGameClaim(
  username: string | undefined,
  gameType: "spin",
  key: string
) {
  const { mutateAsync: recordActivity } = useRecordActivity(
    username,
    "spin-rolled"
  );

  return useMutation({
    mutationKey: ["games", "post", gameType, username],
    mutationFn: async () => {
      if (!username) {
        throw new Error("[SDK][Games] – anon user in game post");
      }

      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/post-game",
        {
          method: "POST",
          body: JSON.stringify({
            game_type: gameType,
            code: getAccessToken(username),
            key,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return (await response.json()) as GameClaim;
    },
    onSuccess() {
      recordActivity();
    },
  });
}
