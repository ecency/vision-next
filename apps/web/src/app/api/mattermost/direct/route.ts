import { NextRequest, NextResponse } from "next/server";
import {
  findMattermostUser,
  getMattermostTokenFromCookies,
  getMattermostUserWithProps,
  getUserDmPrivacy,
  handleMattermostError,
  mmUserFetch,
  MattermostUser
} from "@/server/mattermost";
import { getRelationshipBetweenAccountsQueryOptions } from "@ecency/sdk";
import { getQueryClient } from "@/core/react-query";

export async function POST(req: NextRequest) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const username = (body.username as string | undefined)?.trim().replace(/^@/, "");

    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    // Fetch both users in parallel - they don't depend on each other
    const [targetUser, currentUser] = await Promise.all([
      findMattermostUser(username),
      mmUserFetch<MattermostUser>(`/users/me`, token)
    ]);

    if (!targetUser) {
      return NextResponse.json(
        { error: `@${username} is not on Ecency chat yet.` },
        { status: 404 }
      );
    }

    // Check target user's DM privacy settings
    const targetUserWithProps = await getMattermostUserWithProps(targetUser.id);
    const dmPrivacy = getUserDmPrivacy(targetUserWithProps);

    if (dmPrivacy === "none") {
      return NextResponse.json(
        {
          error: `@${username} has disabled direct messages from all users.`,
          privacy_level: "none"
        },
        { status: 403 }
      );
    }

    if (dmPrivacy === "followers") {
      // Check if target user follows current user
      const relationship = await getQueryClient().fetchQuery(
        getRelationshipBetweenAccountsQueryOptions(targetUser.username, currentUser.username)
      );

      if (!relationship?.follows) {
        return NextResponse.json(
          {
            error: `@${username} only accepts messages from accounts they follow.`,
            privacy_level: "followers",
            target_username: username
          },
          { status: 403 }
        );
      }
    }

    const channel = await mmUserFetch<{ id: string }>(`/channels/direct`, token, {
      method: "POST",
      body: JSON.stringify([currentUser.id, targetUser.id])
    });

    return NextResponse.json({ channelId: channel.id });
  } catch (error) {
    return handleMattermostError(error);
  }
}
