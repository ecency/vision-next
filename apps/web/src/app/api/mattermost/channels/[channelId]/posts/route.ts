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

export async function GET(_req: NextRequest, { params }: { params: { channelId: string } }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { posts, order } = await mmUserFetch<{ posts: Record<string, any>; order: string[] }>(
      `/channels/${params.channelId}/posts?per_page=50&page=0`,
      token
    );

    const orderedPosts = order
      .map((id) => posts[id])
      .filter(Boolean)
      .sort((a, b) => Number(a.create_at) - Number(b.create_at));

    const channelUsers = await mmUserFetch<MattermostUser[]>(
      `/users?in_channel=${params.channelId}&per_page=200&page=0`,
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
    }>(`/channels/${params.channelId}/members/me`, token);

    const moderation = await getMattermostCommunityModerationContext(token, params.channelId);

    return NextResponse.json({
      posts: orderedPosts,
      users,
      channel: moderation.channel,
      member,
      community: moderation.community,
      canModerate: moderation.canModerate
    });
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = body.message as string;
    const rootId = (body.rootId as string | null | undefined) || null;
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
      const moderation = await getMattermostCommunityModerationContext(token, params.channelId);

      if (!moderation.canModerate) {
        return NextResponse.json(
          { error: "Only community moderators can mention everyone in this channel." },
          { status: 403 }
        );
      }
    }

    if (mentionedUsers.length) {
      const channel = await mmUserFetch<MattermostChannel>(`/channels/${params.channelId}`, token);

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
      body: JSON.stringify({ channel_id: params.channelId, message, root_id: rootId || undefined })
    });

    return NextResponse.json({ post });
  } catch (error) {
    return handleMattermostError(error);
  }
}
