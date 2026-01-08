import { CONFIG, EcencyAnalytics } from "@ecency/sdk";
import { useMutation } from "@tanstack/react-query";
import { getBoundFetch } from "@/modules/wallets/utils";
import { getPointsQueryOptions } from "../queries";
import { Points } from "../types";

export function useClaimPoints(
  username: string | undefined,
  accessToken: string | undefined,
  onSuccess?: () => void,
  onError?: Parameters<typeof useMutation>["0"]["onError"]
) {
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    "points-claimed"
  );
  const fetchApi = getBoundFetch();
  return useMutation({
    mutationFn: async () => {
      if (!username) {
        throw new Error(
          "[SDK][Wallets][Assets][Points][Claim] – username wasn't provided"
        );
      }

      if (!accessToken) {
        throw new Error(
          "[SDK][Wallets][Assets][Points][Claim] – access token wasn't found"
        );
      }

      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/points-claim",
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
          body: JSON.stringify({ code: accessToken }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `[SDK][Wallets][Assets][Points][Claim] – failed with status ${response.status}${body ? `: ${body}` : ""}`
        );
      }

      return response.json();
    },
    onError,
    onSuccess: () => {
      recordActivity();

      CONFIG.queryClient.setQueryData<Points>(
        getPointsQueryOptions(username).queryKey,
        (data) => {
          if (!data) {
            return data;
          }

          return {
            points: (
              parseFloat(data.points) + parseFloat(data.uPoints)
            ).toFixed(3),
            uPoints: "0",
          };
        }
      );

      onSuccess?.();
    },
  });
}
