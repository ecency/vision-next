import { NextResponse } from "next/server";
import { getAccountSubscriptionsQueryOptions } from "@ecency/sdk";
import { Subscription } from "@/entities";
import { getQueryClient } from "@/core/react-query";
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
    // 1) Parse body safely
    let body: any;
    try {
        body = await req.json();
    } catch (e) {
        console.error("MM bootstrap: invalid JSON body", e);
        return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const username = body.username as string | undefined;
    const accessToken = body.accessToken as string | undefined;
    const refreshToken = body.refreshToken as string | undefined;
    const displayName = (body.displayName as string | undefined) || username;
    const communityTitle = body.communityTitle as string | undefined;
    const community = body.community as string | undefined;

    if (!username) {
        return NextResponse.json({ error: "username missing" }, { status: 400 });
    }

    // 2) Validate & decode token without ever throwing 500 for client errors
    let rawToken: string | null = null;
    try {
        if (accessToken && validateToken(accessToken)) {
          rawToken = accessToken;
        } else if (refreshToken && validateToken(refreshToken)) {
          rawToken = refreshToken;
        }
    } catch (e) {
        console.error("MM bootstrap: token validation threw", { username, error: e });
        return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    let token: any = null;
    try {
        token = rawToken ? decodeToken(rawToken) : null;
    } catch (e) {
        console.error("MM bootstrap: token decode threw", { username, error: e });
        return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    const authors =
    token?.authors?.map((author: string) => author?.toLowerCase?.()) || [];

    if (!token || !authors.includes(username.toLowerCase())) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 3) Mattermost user / team / personal token
    let user;
    let personalToken: string;
    try {
        user = await ensureMattermostUser(username);
        await ensureUserInTeam(user.id);
        personalToken = await ensurePersonalToken(user.id);
    } catch (e) {
        console.error("MM bootstrap: MM user/team/token error", {
          username,
          error: e
        });
        // This is effectively an upstream / chat outage
        return NextResponse.json(
          { error: "chat service unavailable" },
          { status: 502 }
        );
    }

    // 4) Hive subscriptions (already partly protected)
    let subscriptions: Subscription[] = [];
    try {
        subscriptions =
          (await getQueryClient().fetchQuery(
            getAccountSubscriptionsQueryOptions(username)
          )) || [];
    } catch (error) {
        console.error("MM bootstrap: Unable to load Hive/Ecency subscriptions", error);
    }

    const communityIds = subscriptions
        .map((sub: Subscription) => ({ id: sub?.[0], title: sub?.[1] }))
        .filter(
          (value): value is { id: string; title: string | undefined } =>
            Boolean(value.id)
        );

    const uniqueCommunityIds = new Map<string, string | undefined>();
    for (const c of communityIds) {
        if (!uniqueCommunityIds.has(c.id)) {
          uniqueCommunityIds.set(c.id, c.title);
        }
    }

    let channelId: string | null = null;
    try {
        // Ensure channels exist for subscribed communities, but DON'T force membership
        // This prevents auto-rejoining users to channels they've explicitly left
        // Parallelize channel creation - CRITICAL for performance
        const channelPromises = Array.from(uniqueCommunityIds).map(
          async ([communityId, title]) => {
            // autoJoin = false: only ensure channel exists, don't force user membership
            const ensuredChannelId = await ensureCommunityChannelMembership(
              user.id,
              communityId,
              title,
              false // Don't auto-join - users will join manually
            );
            return { communityId, channelId: ensuredChannelId };
          }
        );

        const channelResults = await Promise.all(channelPromises);

        // Find the requested community's channel if specified
        if (community) {
          const found = channelResults.find((r) => r.communityId === community);
          channelId = found?.channelId || null;

          // If not found in subscriptions, create it and join the user
          if (!channelId) {
            // For explicitly requested community, DO auto-join
            channelId = await ensureCommunityChannelMembership(
              user.id,
              community,
              communityTitle || displayName || community,
              true // Auto-join for explicitly requested community
            );
          }
        }
    } catch (e) {
        console.error("MM bootstrap: channel membership error", {
          username,
          userId: user.id,
          error: e
        });
        return NextResponse.json(
          { error: "failed to prepare channels" },
          { status: 500 }
        );
    }

    const response = NextResponse.json({
        ok: true,
        userId: user.id,
        channelId,
        token: personalToken
    });
    return withMattermostTokenCookie(response, personalToken);
    } catch (error) {
        console.error("MM bootstrap: unexpected top-level error", error);
        const message = error instanceof Error ? error.message : "unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
