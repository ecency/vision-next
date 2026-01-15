import { InstanceConfigManager } from "@/core";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/features/shared/user-avatar";
import { useMemo } from "react";

export function BlogSidebar() {
  const username = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.username
  );

  const sidebarConfig = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.layout.sidebar
  );

  const showFollowers = sidebarConfig.followers?.enabled ?? true;
  const showFollowing = sidebarConfig.following?.enabled ?? true;
  const showHiveInfo = sidebarConfig.hiveInformation?.enabled ?? true;

  const { data } = useQuery(getAccountFullQueryOptions(username));

  const joinDate = useMemo(() => {
    if (!data?.created) return null;
    return new Date(data.created).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  }, [data?.created]);

  return (
    <div className="lg:sticky lg:top-0 border-b lg:border-b-0 lg:border-l border-gray-200 p-4 sm:p-6 lg:h-screen lg:overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <UserAvatar username={username} size="sLarge" />
        <div
          className="text-sm sm:text-base font-bold"
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
      {data?.follow_stats && (showFollowers || showFollowing) && (
        <div className="flex gap-6 mb-4">
          {showFollowers && (
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
          )}
          {showFollowing && (
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
          )}
        </div>
      )}
      {showHiveInfo && data && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div
            className="text-xs font-medium mb-2"
            style={{ color: "rgba(0, 0, 0, 0.54)" }}
          >
            Hive Info
          </div>
          {data.reputation !== undefined && (
            <div className="text-xs mb-1" style={{ color: "rgba(0, 0, 0, 0.54)" }}>
              <span className="font-medium">Reputation:</span>{" "}
              {Math.floor(data.reputation)}
            </div>
          )}
          {joinDate && (
            <div className="text-xs mb-1" style={{ color: "rgba(0, 0, 0, 0.54)" }}>
              <span className="font-medium">Joined:</span> {joinDate}
            </div>
          )}
          {data.post_count !== undefined && (
            <div className="text-xs" style={{ color: "rgba(0, 0, 0, 0.54)" }}>
              <span className="font-medium">Posts:</span> {data.post_count}
            </div>
          )}
        </div>
      )}
      {data?.profile?.location && (
        <div className="text-xs mb-2 mt-4" style={{ color: "rgba(0, 0, 0, 0.54)" }}>
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
