import { mmUserFetch, mmUserFetchNdjson } from "@/server/mattermost";

interface MattermostChannel {
  id: string;
  name: string;
  display_name: string;
  type: string;
  is_favorite?: boolean;
  is_muted?: boolean;
  total_msg_count?: number;
  mention_count?: number;
  message_count?: number;
  order?: number;
  last_post_at?: number;
  last_viewed_at?: number;
}

interface MattermostChannelMemberCounts {
  user_id: string;
  channel_id: string;
  mention_count: number;
  msg_count: number;
  notify_props?: {
    mark_unread?: string;
  };
  last_viewed_at?: number;
  last_update_at?: number;
}

// `/users/me/channels` returns the user's full channel list as a single
// streamed response when no `page`/`per_page` are supplied. This matches
// Client4.getAllTeamsChannels in the official Mattermost webapp and avoids
// the 3-page sequential round-trip the previous paginated form required.
export async function fetchAllChannelPages(token: string): Promise<MattermostChannel[]> {
  const result = await mmUserFetch<MattermostChannel[]>("/users/me/channels", token);
  return Array.isArray(result) ? result : [];
}

// `/users/me/channel_members?page=-1` switches Mattermost into NDJSON
// streaming mode (Client4.getAllChannelsMembers uses this with userId/-1).
// It returns every channel-member row for the user across teams in a single
// response, removing the sequential pagination we used to do per team.
export async function fetchAllChannelMemberPages(
  token: string
): Promise<MattermostChannelMemberCounts[]> {
  return await mmUserFetchNdjson<MattermostChannelMemberCounts>(
    "/users/me/channel_members?page=-1",
    token
  );
}
