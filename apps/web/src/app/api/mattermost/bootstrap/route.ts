import { NextResponse } from "next/server";
import { getSubscriptions } from "@/api/bridge";
import { Subscription } from "@/entities";
import {
  ensureCommunityChannelMembership,
  ensureMattermostUser,
  ensurePersonalToken,
  ensureUserInTeam,
  withMattermostTokenCookie
} from "@/server/mattermost";
import { decodeToken, validateToken } from "@/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body.username as string | undefined;
    const accessToken = body.accessToken as string | undefined;
    const displayName = (body.displayName as string | undefined) || username;
    const communityTitle = body.communityTitle as string | undefined;
    const community = body.community as string | undefined;

    if (!username) {
      return NextResponse.json({ error: "username missing" }, { status: 400 });
    }

    const token = accessToken && validateToken(accessToken) ? decodeToken(accessToken) : null;
    if (!token || !token.authors?.includes(username)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const user = await ensureMattermostUser(username);
    await ensureUserInTeam(user.id);
    const personalToken = await ensurePersonalToken(user.id);

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
      const ensuredChannelId = await ensureCommunityChannelMembership(user.id, communityId, title);
      if (community && communityId === community) {
        channelId = ensuredChannelId;
      }
    }

    if (community && !channelId) {
      channelId = await ensureCommunityChannelMembership(
        user.id,
        community,
        communityTitle || displayName || community
      );
    }

    const response = NextResponse.json({ ok: true, userId: user.id, channelId });
    return withMattermostTokenCookie(response, personalToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
