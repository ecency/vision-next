import { CONFIG, getBoundFetch } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";
import { GameClaim } from "../types";
import { useRecordActivity } from "@/modules/analytics/mutations";

export function useGameClaim(
  username: string | undefined,
  code: string | undefined,
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
      if (!username || !code) {
        throw new Error("[SDK][Games] – missing auth");
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/post-game",
        {
          method: "POST",
          body: JSON.stringify({
            game_type: gameType,
            code,
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
