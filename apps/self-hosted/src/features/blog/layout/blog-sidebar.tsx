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
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sticky top-4">
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar username={username} size="sLarge" />
        <div className="text-lg font-bold">{data?.name || username}</div>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {data?.profile?.about}
      </div>
      {data?.follow_stats && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Followers
            </div>
            <div className="text-sm text-blue-500 dark:text-blue-400 font-medium">
              {data.follow_stats.follower_count}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Following
            </div>
            <div className="text-sm text-blue-500 dark:text-blue-400 font-medium">
              {data.follow_stats.following_count}
            </div>
          </div>
        </div>
      )}
      {data?.profile?.location && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          <span className="font-medium">Location:</span> {data.profile.location}
        </div>
      )}
      {data?.profile?.website && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          <span className="font-medium">Website:</span> {data.profile.website}
        </div>
      )}
    </div>
  );
}
