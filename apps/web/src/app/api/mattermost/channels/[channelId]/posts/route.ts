import { NextRequest, NextResponse } from "next/server";
import {
  ensureMattermostUser,
  ensureUserInChannel,
  ensureUserInTeam,
  followMattermostThreadForUser,
  getMattermostCommunityModerationContext,
  getMattermostUserWithProps,
  getUserDmPrivacy,
  handleMattermostError,
  MattermostChannel,
  getMattermostTokenFromCookies,
  mmUserFetch,
  isUserChatBanned,
  CHAT_BAN_PROP
} from "@/server/mattermost";
import { getRelationshipBetweenAccountsQueryOptions } from "@ecency/sdk";
import { getQueryClient } from "@/core/react-query";

// Prevent artificial timeout - this route should be fast now
export const maxDuration = 60; // 60 seconds max
export const dynamic = "force-dynamic";

const USER_MENTION_REGEX =
  /@(?=[a-zA-Z][a-zA-Z0-9.-]{1,15}\b)[a-zA-Z][a-zA-Z0-9-]{2,}(?:\.[a-zA-Z][a-zA-Z0-9-]{2,})*\b/gi;

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { channelId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const before = searchParams.get("before") || "";
    const around = searchParams.get("around") || "";
    const perPage = searchParams.get("per_page") || "60";

    let posts: Record<string, any>;
    let order: string[];
    let orderedPosts: any[];

    if (around) {
      // Fetch messages around a specific message (for deep linking)
      const [beforeData, afterData, targetPost] = await Promise.all([
        mmUserFetch<{ posts: Record<string, any>; order: string[] }>(
          `/channels/${channelId}/posts?before=${around}&per_page=30`,
          token
        ).catch(() => ({ posts: {}, order: [] })),
        mmUserFetch<{ posts: Record<string, any>; order: string[] }>(
          `/channels/${channelId}/posts?after=${around}&per_page=30`,
          token
        ).catch(() => ({ posts: {}, order: [] })),
        mmUserFetch<any>(`/posts/${around}`, token).catch(() => null)
      ]);

      // Verify target post exists and belongs to this channel
      if (!targetPost || targetPost.channel_id !== channelId) {
        return NextResponse.json(
          { error: "Message not found or deleted" },
          { status: 404 }
        );
      }

      // Merge posts: before + target + after
      posts = {
        ...beforeData.posts,
        [around]: targetPost,
        ...afterData.posts
      };

      order = [...beforeData.order, around, ...afterData.order];

      orderedPosts = order
        .map((id) => posts[id])
        .filter(Boolean)
        .sort((a, b) => Number(a.create_at) - Number(b.create_at));
    } else {
      // Existing logic for before/initial pagination
      let queryParams = `per_page=${perPage}&page=0`;
      if (before) {
        queryParams += `&before=${before}`;
      }

      const response = await mmUserFetch<{
        posts: Record<string, any>;
        order: string[];
      }>(`/channels/${channelId}/posts?${queryParams}`, token);

      posts = response.posts;
      order = response.order;

      orderedPosts = order
        .map((id) => posts[id])
        .filter(Boolean)
        .sort((a, b) => Number(a.create_at) - Number(b.create_at));
    }

    // Fetch channel users first, then parallel fetch their statuses
    const channelUsers = await mmUserFetch<MattermostUser[]>(
      `/users?in_channel=${channelId}&per_page=200&page=0`,
      token
    );

    // Fetch status for channel members to determine who is online (parallel with other operations)
    let onlineUserIds: string[] = [];
    const statusPromise = mmUserFetch<{ user_id: string; status: string }[]>(
      `/users/status/ids`,
      token,
      {
        method: "POST",
        body: JSON.stringify(channelUsers.map((user) => user.id))
      }
    ).then((statuses) => {
      onlineUserIds = statuses
        .filter((status) => status.status && status.status !== "offline")
        .map((status) => status.user_id);
    }).catch((error) => {
      // If we cannot fetch statuses, continue without online information
      console.error("Failed to fetch channel member statuses:", error);
    });

    const users = channelUsers.reduce<Record<string, MattermostUser>>(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {}
    );

    const userIds = Array.from(
      new Set(orderedPosts.map((post) => post.user_id).filter(Boolean))
    );

    const missingUserIds = userIds.filter((id) => !users[id]);

    if (missingUserIds.length) {
      const missingUsers = await mmUserFetch<MattermostUser[]>(
        "/users/ids",
        token,
        {
          method: "POST",
          body: JSON.stringify(missingUserIds)
        }
      );

      for (const user of missingUsers) {
        users[user.id] = user;
      }
    }

    // Parallelize independent fetches for better performance
    const [member, moderation, statsResult] = await Promise.all([
      mmUserFetch<{
        channel_id: string;
        user_id: string;
        roles: string;
        last_viewed_at: number;
        mention_count: number;
        msg_count: number;
      }>(`/channels/${channelId}/members/me`, token),
      getMattermostCommunityModerationContext(token, channelId),
      mmUserFetch<{ member_count: number }>(`/channels/${channelId}/stats`, token)
        .catch((error) => {
          console.error("Failed to fetch channel stats:", error);
          return null;
        }),
      statusPromise // Wait for online status fetch to complete
    ]);

    const memberCount = statsResult?.member_count;

    // Check if there are more messages by looking at the order length
    // For "around" queries, set hasMore to true to allow infinite scroll to work
    const hasMore = around ? true : order.length >= parseInt(perPage, 10);

    return NextResponse.json({
      posts: orderedPosts,
      users,
      channel: moderation.channel,
      member,
      community: moderation.community,
      canModerate: moderation.canModerate,
      hasMore,
      memberCount,
      onlineUserIds
    });
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
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

    // Fetch user and channel in parallel - they don't depend on each other
    const [currentUser, channel] = await Promise.all([
      mmUserFetch<{
        id: string;
        username: string;
        props?: Record<string, string>;
      }>(`/users/me`, token),
      mmUserFetch<MattermostChannel>(`/channels/${channelId}`, token)
    ]);

    const bannedUntil = isUserChatBanned(currentUser);
    if (bannedUntil) {
      return NextResponse.json(
        {
          error: `@${currentUser.username} is banned from chat until ${new Date(
            Number(bannedUntil)
          ).toISOString()}`,
          bannedUntil,
          prop: CHAT_BAN_PROP
        },
        { status: 403 }
      );
    }

    // --- DM Privacy Check (Defense-in-Depth) ---
    // For DM channels, verify sender is allowed based on recipient's privacy settings

    if (channel.type === "D") {
      // Get the other user in the DM
      const members = await mmUserFetch<{ user_id: string }[]>(
        `/channels/${channelId}/members`,
        token
      );

      const otherUserId = members.find((m) => m.user_id !== currentUser.id)?.user_id;

      if (otherUserId) {
        const otherUser = await getMattermostUserWithProps(otherUserId);
        const dmPrivacy = getUserDmPrivacy(otherUser);

        if (dmPrivacy === "none") {
          return NextResponse.json(
            { error: `@${otherUser.username} has disabled direct messages.` },
            { status: 403 }
          );
        }

        if (dmPrivacy === "followers") {
          const relationship = await getQueryClient().fetchQuery(
            getRelationshipBetweenAccountsQueryOptions(otherUser.username, currentUser.username)
          );

          if (!relationship?.follows) {
            return NextResponse.json(
              {
                error: `@${otherUser.username} only accepts messages from accounts they follow.`
              },
              { status: 403 }
            );
          }
        }
      }
    }

    // Thread following moved to AFTER response to avoid blocking client

    // --- Special mentions & regular @mentions in text ---
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
      const moderation = await getMattermostCommunityModerationContext(
        token,
        channelId
      );

      if (!moderation.canModerate) {
        return NextResponse.json(
          {
            error: "Only community moderators can mention everyone in this channel."
          },
          { status: 403 }
        );
      }
    }

    // Send the message FIRST, then handle mentions async to avoid blocking response
    const post = await mmUserFetch(`/posts`, token, {
      method: "POST",
      body: JSON.stringify({
        channel_id: channelId,
        message,
        root_id: rootId || undefined,
        props: props || undefined,
        pending_post_id: body.pendingPostId || `${currentUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
    });

    // --- Background tasks (non-blocking) ---

    // Ensure @mentioned users are members of the public channel (async)
    // Mattermost's native @mention system will handle notifications
    if (mentionedUsers.length) {
      mmUserFetch<MattermostChannel>(`/channels/${channelId}`, token)
        .then((channel) => {
          if (channel.type === "O") {
            return Promise.all(
              mentionedUsers.map(async (username) => {
                try {
                  const user = await ensureMattermostUser(username);
                  await ensureUserInTeam(user.id);
                  await ensureUserInChannel(user.id, channel.id);
                } catch (error) {
                  console.error(
                    `Unable to ensure mentioned user ${username} in channel`,
                    error
                  );
                }
              })
            );
          }
        })
        .catch((error) => {
          console.error("Unable to process mentioned users", error);
        });
    }

    // Follow thread for parent author only in public channels (async)
    if (rootId && props?.parent_id && channel.type === "O") {
      mmUserFetch<{ user_id: string }>(`/posts/${props.parent_id}`, token)
        .then((parentPost) => {
          if (parentPost.user_id !== currentUser.id) {
            return followMattermostThreadForUser(parentPost.user_id, rootId);
          }
        })
        .catch((error) => {
          console.error("Unable to follow thread for parent author", error);
        });
    }

    return NextResponse.json({ post });
  } catch (error) {
    return handleMattermostError(error);
  }
}
