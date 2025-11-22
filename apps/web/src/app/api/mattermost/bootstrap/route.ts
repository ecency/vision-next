import { NextResponse } from "next/server";
import { getSubscriptions } from "@/api/bridge";
import { Subscription } from "@/entities";
import {
  ensureChannelForCommunity,
  ensureMattermostUser,
  ensurePersonalToken,
  ensureUserInChannel,
  ensureUserInTeam,
  withMattermostTokenCookie
} from "@/server/mattermost";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body.username as string | undefined;
    const displayName = (body.displayName as string | undefined) || username;
    const community = body.community as string | undefined;

    if (!username) {
      return NextResponse.json({ error: "username missing" }, { status: 400 });
    }

    const user = await ensureMattermostUser(username);
    await ensureUserInTeam(user.id);
    const token = await ensurePersonalToken(user.id);

    let subscriptions: Subscription[] = [];
    try {
      subscriptions = (await getSubscriptions(username)) || [];
    } catch (error) {
      console.error("Unable to load Hive/Ecency subscriptions", error);
    }

    const communityIds = subscriptions
      .map((sub: Subscription) => ({ id: sub?.[0], title: sub?.[1] }))
      .filter((value): value is { id: string; title: string | undefined } => Boolean(value.id));

    const uniqueCommunityIds = new Map<string, string | undefined>();
    for (const community of communityIds) {
      if (!uniqueCommunityIds.has(community.id)) {
        uniqueCommunityIds.set(community.id, community.title);
      }
    }

    let channelId: string | null = null;
    for (const [communityId, title] of uniqueCommunityIds) {
      const ensuredChannelId = await ensureChannelForCommunity(communityId, title);
      await ensureUserInChannel(user.id, ensuredChannelId);
      if (community && communityId === community) {
        channelId = ensuredChannelId;
      }
    }

    if (community && !channelId) {
      const ensuredChannelId = await ensureChannelForCommunity(community, displayName);
      await ensureUserInChannel(user.id, ensuredChannelId);
      channelId = ensuredChannelId;
    }

    const response = NextResponse.json({ ok: true, userId: user.id, channelId });
    return withMattermostTokenCookie(response, token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
