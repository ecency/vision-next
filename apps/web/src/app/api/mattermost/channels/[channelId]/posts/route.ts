import { NextRequest, NextResponse } from "next/server";
import {
  ensureMattermostUser,
  ensureUserInChannel,
  ensureUserInTeam,
  getMattermostCommunityModerationContext,
  handleMattermostError,
  MattermostChannel,
  getMattermostTokenFromCookies,
  mmUserFetch,
  isUserChatBanned,
  CHAT_BAN_PROP
} from "@/server/mattermost";

const USER_MENTION_REGEX = /@(?=[a-zA-Z][a-zA-Z0-9.-]{1,15}\b)[a-zA-Z][a-zA-Z0-9-]{2,}(?:\.[a-zA-Z][a-zA-Z0-9-]{2,})*\b/gi;
const SPECIAL_MENTIONS = new Set(["here", "everyone"]);
const SPECIAL_MENTION_REGEX = /(^|\s)@(here|everyone)\b/i;

interface MattermostUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  last_picture_update?: number;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { channelId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const before = searchParams.get("before") || "";
    const perPage = searchParams.get("per_page") || "60";

    // Build query params for Mattermost API
    let queryParams = `per_page=${perPage}&page=0`;
    if (before) {
      queryParams += `&before=${before}`;
    }

    const { posts, order } = await mmUserFetch<{ posts: Record<string, any>; order: string[] }>(
      `/channels/${channelId}/posts?${queryParams}`,
      token
    );

    const orderedPosts = order
      .map((id) => posts[id])
      .filter(Boolean)
      .sort((a, b) => Number(a.create_at) - Number(b.create_at));

    const channelUsers = await mmUserFetch<MattermostUser[]>(
      `/users?in_channel=${channelId}&per_page=200&page=0`,
      token
    );

    const users = channelUsers.reduce<Record<string, MattermostUser>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const userIds = Array.from(new Set(orderedPosts.map((post) => post.user_id).filter(Boolean)));

    const missingUserIds = userIds.filter((id) => !users[id]);

    if (missingUserIds.length) {
      const missingUsers = await mmUserFetch<MattermostUser[]>("/users/ids", token, {
        method: "POST",
        body: JSON.stringify(missingUserIds)
      });

      for (const user of missingUsers) {
        users[user.id] = user;
      }
    }

    const member = await mmUserFetch<{
      channel_id: string;
      user_id: string;
      roles: string;
      last_viewed_at: number;
      mention_count: number;
      msg_count: number;
    }>(`/channels/${channelId}/members/me`, token);

    const moderation = await getMattermostCommunityModerationContext(token, channelId);

    // Fetch channel stats to get member count
    let memberCount: number | undefined;
    try {
      const stats = await mmUserFetch<{ member_count: number }>(
        `/channels/${channelId}/stats`,
        token
      );
      memberCount = stats.member_count;
    } catch (error) {
      // If stats fetch fails, continue without member count
      console.error("Failed to fetch channel stats:", error);
    }

    // Check if there are more messages by looking at the order length
    const hasMore = order.length >= parseInt(perPage);

    return NextResponse.json({
      posts: orderedPosts,
      users,
      channel: moderation.channel,
      member,
      community: moderation.community,
      canModerate: moderation.canModerate,
      hasMore,
      memberCount
    });
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { channelId } = await params;
    const body = await req.json();
    const message = body.message as string;
    const rootId = (body.rootId as string | null | undefined) || null;
    const props = (body.props as Record<string, unknown> | undefined) || undefined;
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const currentUser = await mmUserFetch<{ id: string; username: string; props?: Record<string, string> }>(
      `/users/me`,
      token
    );

    const bannedUntil = isUserChatBanned(currentUser);

    if (bannedUntil) {
      return NextResponse.json(
        {
          error: `@${currentUser.username} is banned from chat until ${new Date(Number(bannedUntil)).toISOString()}`,
          bannedUntil,
          prop: CHAT_BAN_PROP
        },
        { status: 403 }
      );
    }

    const hasSpecialMention = SPECIAL_MENTION_REGEX.test(message);
    const mentionedUsers = Array.from(
      new Set(
        message
          .match(USER_MENTION_REGEX)
          ?.map((mention) => mention.slice(1).toLowerCase())
          .filter((username) => !SPECIAL_MENTIONS.has(username)) || []
      )
    );

    if (hasSpecialMention) {
      const moderation = await getMattermostCommunityModerationContext(token, channelId);

      if (!moderation.canModerate) {
        return NextResponse.json(
          { error: "Only community moderators can mention everyone in this channel." },
          { status: 403 }
        );
      }
    }

    if (mentionedUsers.length) {
      const channel = await mmUserFetch<MattermostChannel>(`/channels/${channelId}`, token);

      if (channel.type === "O") {
        for (const username of mentionedUsers) {
          try {
            const user = await ensureMattermostUser(username);
            await ensureUserInTeam(user.id);
            await ensureUserInChannel(user.id, channel.id);
          } catch (error) {
            console.error(`Unable to ensure mentioned user ${username} in channel`, error);
          }
        }
      }
    }

    const post = await mmUserFetch(`/posts`, token, {
      method: "POST",
      body: JSON.stringify({
          channel_id: channelId,
          message,
          root_id: rootId || undefined,
          props: props || undefined
      })
    });

    return NextResponse.json({ post });
  } catch (error) {
    return handleMattermostError(error);
  }
}
