import { InstanceConfigManager, formatMonthYear, t } from "@/core";
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
    return formatMonthYear(data.created);
  }, [data?.created]);

  return (
    <div className="lg:sticky lg:top-0 border-b lg:border-b-0 lg:border-l border-theme p-4 sm:p-6 lg:h-screen lg:overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <UserAvatar username={username} size="sLarge" />
        <div className="text-sm sm:text-base font-bold font-theme-ui text-theme-primary">
          {data?.name || username}
        </div>
      </div>
      {data?.profile?.about && (
        <div className="text-sm mb-4 text-theme-muted leading-[1.58]">
          {data.profile.about}
        </div>
      )}
      {data?.follow_stats && (showFollowers || showFollowing) && (
        <div className="flex gap-6 mb-4">
          {showFollowers && (
            <div className="flex flex-col">
              <div className="text-xs text-theme-muted">
                {t("followers")}
              </div>
              <div className="text-sm font-medium text-theme-primary">
                {data.follow_stats.follower_count}
              </div>
            </div>
          )}
          {showFollowing && (
            <div className="flex flex-col">
              <div className="text-xs text-theme-muted">
                {t("following")}
              </div>
              <div className="text-sm font-medium text-theme-primary">
                {data.follow_stats.following_count}
              </div>
            </div>
          )}
        </div>
      )}
      {showHiveInfo && data && (
        <div className="border-t border-theme pt-4 mt-4">
          <div className="text-xs font-medium mb-2 text-theme-muted">
            {t("hiveInfo")}
          </div>
          {data.reputation !== undefined && (
            <div className="text-xs mb-1 text-theme-muted">
              <span className="font-medium">{t("reputation")}:</span>{" "}
              {Math.floor(data.reputation)}
            </div>
          )}
          {joinDate && (
            <div className="text-xs mb-1 text-theme-muted">
              <span className="font-medium">{t("joined")}:</span> {joinDate}
            </div>
          )}
          {data.post_count !== undefined && (
            <div className="text-xs text-theme-muted">
              <span className="font-medium">{t("posts")}:</span> {data.post_count}
            </div>
          )}
        </div>
      )}
      {data?.profile?.location && (
        <div className="text-xs mb-2 mt-4 text-theme-muted">
          <span className="font-medium">{t("location")}:</span> {data.profile.location}
        </div>
      )}
      {data?.profile?.website && (
        <div className="text-xs text-theme-muted">
          <span className="font-medium">{t("website")}:</span>{" "}
          <a
            href={data.profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-theme-accent"
          >
            {data.profile.website}
          </a>
        </div>
      )}
    </div>
  );
}
