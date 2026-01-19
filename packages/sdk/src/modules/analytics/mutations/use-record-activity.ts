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

export interface RecordActivityOptions {
  url?: string;
  domain?: string;
}

/**
 * Get current location info safely (works in browser and Node.js)
 * Returns empty strings in non-browser environments
 */
function getLocationInfo(): { url: string; domain: string } {
  if (typeof window !== "undefined" && window.location) {
    return {
      url: window.location.href,
      domain: window.location.host,
    };
  }
  return { url: "", domain: "" };
}

export function useRecordActivity(
  username: string | undefined,
  activityType: ActivityType,
  options?: RecordActivityOptions
) {
  return useMutation({
    mutationKey: ["analytics", activityType],
    mutationFn: async () => {
      if (!activityType) {
        throw new Error("[SDK][Analytics] – no activity type provided");
      }
      const fetchApi = getBoundFetch();

      // Use provided values or auto-detect from browser environment
      // Falls back to empty strings in non-browser environments (Node.js, React Native, etc.)
      const locationInfo = getLocationInfo();
      const url = options?.url ?? locationInfo.url;
      const domain = options?.domain ?? locationInfo.domain;

      await fetchApi(CONFIG.plausibleHost + "/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: activityType,
          url,
          domain,
          props: {
            username,
          },
        }),
      });
    },
  });
}
