import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { EcencyAnalytics } from "@/modules/analytics";
import { useMutation } from "@tanstack/react-query";
import { getPointsQueryOptions } from "../queries";
import type { Points } from "../types";

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

  return useMutation({
    mutationFn: async () => {
      if (!username) {
        throw new Error(
          "[SDK][Points][Claim] – username wasn't provided"
        );
      }

      if (!accessToken) {
        throw new Error(
          "[SDK][Points][Claim] – access token wasn't found"
        );
      }

      const fetchApi = getBoundFetch();
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
        if (response.status === 406) {
          try {
            return JSON.parse(body);
          } catch {
            return { message: body, code: response.status };
          }
        }
        throw new Error(
          `[SDK][Points][Claim] – failed with status ${response.status}${body ? `: ${body}` : ""}`
        );
      }

      return response.json();
    },
    onError,
    onSuccess: () => {
      recordActivity();

      getQueryClient().setQueryData<Points>(
        getPointsQueryOptions(username).queryKey,
        (data) => {
          if (!data) {
            return data;
          }

          return {
            ...data,
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
