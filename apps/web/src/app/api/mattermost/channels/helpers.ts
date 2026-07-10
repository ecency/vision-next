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

/** A channel is muted when the member opted out of unread marking (mobile parity). */
export function isChannelMuted(member?: { notify_props?: { mark_unread?: string } }): boolean {
  return member?.notify_props?.mark_unread === "mention";
}

/**
 * A channel has never been viewed when the member has no meaningful
 * `last_viewed_at`. Mattermost represents "never viewed" as either a missing
 * value or the int64 zero (`0`), so both must count — otherwise a never-viewed
 * DM slips through and floods the badge with historical messages. Such channels
 * are excluded from the unread badge on purpose.
 */
export function isChannelNeverViewed(member?: { last_viewed_at?: number | null }): boolean {
  return member?.last_viewed_at == null || member.last_viewed_at === 0;
}

/** Unread messages = total posts in the channel minus what the member has read. */
export function channelUnreadMessageCount(
  channel: { total_msg_count?: number },
  member?: { msg_count?: number }
): number {
  return Math.max((channel.total_msg_count || 0) - (member?.msg_count || 0), 0);
}

/**
 * Whether a DM contributes to the unread badge. This is the SINGLE source of
 * truth shared by two routes that must agree:
 *  - `channels/unreads` COUNTS such DMs into the badge, and
 *  - `channels` force-SHOWS them in the list.
 * If the two ever drift, a closed DM can show a badge count with no row to open
 * and clear it — the "phantom unread" bug. A DM contributes when it is not
 * muted, has been viewed at least once, and has unread messages.
 */
export function dmContributesToUnreadBadge(
  channel: { total_msg_count?: number },
  member?: {
    msg_count?: number;
    last_viewed_at?: number | null;
    notify_props?: { mark_unread?: string };
  }
): boolean {
  if (!member) return false;
  if (isChannelMuted(member)) return false;
  if (isChannelNeverViewed(member)) return false;
  return channelUnreadMessageCount(channel, member) > 0;
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
