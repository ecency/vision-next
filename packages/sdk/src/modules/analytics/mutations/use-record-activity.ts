import { CONFIG, getBoundFetch } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";

type ActivityType =
  // Editor related
  | "post-created"
  | "post-updated"
  | "post-scheduled"
  | "draft-created"
  | "video-published"

  // Legacy editor related
  | "legacy-post-created"
  | "legacy-post-updated"
  | "legacy-post-scheduled"
  | "legacy-draft-created"
  | "legacy-video-published"

  // Perks related
  | "perks-points-by-qr"
  | "perks-account-boost"
  | "perks-promote"
  | "perks-boost-plus"
  | "points-claimed"
  | "spin-rolled"

  // Signup related
  | "signed-up-with-wallets"
  | "signed-up-with-email";

export function useRecordActivity(
  username: string | undefined,
  activityType: ActivityType
) {
  return useMutation({
    mutationKey: ["analytics", activityType],
    mutationFn: async () => {
      if (!activityType) {
        throw new Error("[SDK][Analytics] – no activity type provided");
      }
      const fetchApi = getBoundFetch();

      await fetchApi(CONFIG.plausibleHost + "/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: activityType,
          url: window.location.href,
          domain: window.location.host,
          props: {
            username,
          },
        }),
      });
    },
  });
}
