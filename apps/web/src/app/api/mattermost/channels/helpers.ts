import { mmUserFetch } from "@/server/mattermost";

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

export const pageSize = 200;
export const maxPages = 3;

export async function fetchAllChannelPages(token: string): Promise<MattermostChannel[]> {
  const results: MattermostChannel[] = [];
  for (let page = 0; page < maxPages; page++) {
    const pageItems = await mmUserFetch<MattermostChannel[]>(
      `/users/me/channels?page=${page}&per_page=${pageSize}`,
      token
    );
    const items = Array.isArray(pageItems) ? pageItems : [];
    results.push(...items);
    if (items.length < pageSize) return results;
  }
  return results;
}

export async function fetchAllChannelMemberPages(
  teamId: string,
  token: string
): Promise<MattermostChannelMemberCounts[]> {
  const results: MattermostChannelMemberCounts[] = [];
  for (let page = 0; page < maxPages; page++) {
    const pageItems = await mmUserFetch<MattermostChannelMemberCounts[]>(
      `/users/me/teams/${teamId}/channels/members?page=${page}&per_page=${pageSize}`,
      token
    );
    const items = Array.isArray(pageItems) ? pageItems : [];
    results.push(...items);
    if (items.length < pageSize) return results;
  }
  return results;
}
