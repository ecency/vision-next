import { InstanceConfigManager } from "@/core";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/features/shared/user-avatar";

export function BlogSidebar() {
  const username = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.username
  );

  const { data } = useQuery(getAccountFullQueryOptions(username));

  return (
    <div className="sticky top-0 border-l border-gray-200 p-6 h-screen">
      <div className="flex items-center gap-3 mb-4">
        <UserAvatar username={username} size="sLarge" />
        <div
          className="text-base font-bold"
          style={{
            fontFamily:
              '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
            color: "rgba(0, 0, 0, 0.84)",
          }}
        >
          {data?.name || username}
        </div>
      </div>
      {data?.profile?.about && (
        <div
          className="text-sm mb-4"
          style={{ color: "rgba(0, 0, 0, 0.54)", lineHeight: "1.58" }}
        >
          {data.profile.about}
        </div>
      )}
      {data?.follow_stats && (
        <div className="flex gap-6 mb-4">
          <div className="flex flex-col">
            <div className="text-xs" style={{ color: "rgba(0, 0, 0, 0.54)" }}>
              Followers
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: "rgba(0, 0, 0, 0.84)" }}
            >
              {data.follow_stats.follower_count}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-xs" style={{ color: "rgba(0, 0, 0, 0.54)" }}>
              Following
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: "rgba(0, 0, 0, 0.84)" }}
            >
              {data.follow_stats.following_count}
            </div>
          </div>
        </div>
      )}
      {data?.profile?.location && (
        <div className="text-xs mb-2" style={{ color: "rgba(0, 0, 0, 0.54)" }}>
          <span className="font-medium">Location:</span> {data.profile.location}
        </div>
      )}
      {data?.profile?.website && (
        <div className="text-xs" style={{ color: "rgba(0, 0, 0, 0.54)" }}>
          <span className="font-medium">Website:</span>{" "}
          <a
            href={data.profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {data.profile.website}
          </a>
        </div>
      )}
    </div>
  );
}
