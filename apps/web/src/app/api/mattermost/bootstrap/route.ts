import { NextResponse } from "next/server";
import { getAccountSubscriptionsQueryOptions } from "@ecency/sdk";
import { QueryClient } from "@tanstack/react-query";
import { Subscription } from "@/entities";
import {
  ensureCommunityChannelMembership,
  ensureMattermostUser,
  ensurePersonalToken,
  ensureUserInTeam,
  getMattermostUserWithProps,
  getUserLeftChannels,
  removeUserLeftChannel,
  withMattermostTokenCookie
} from "@/server/mattermost";
import { decodeToken, validateToken } from "@/utils";

// Hard ceiling on the entire bootstrap handler. Individual mmFetch calls
// have their own 10s timeout, but a user with 50 communities chains
// 10+ batches sequentially. Without a total cap, worst case is 100s+.
const BOOTSTRAP_TIMEOUT_MS = 30_000;

export async function POST(req: Request) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), BOOTSTRAP_TIMEOUT_MS);

  try {
    // Promise.race guarantees a hard 30s response deadline.
    // The AbortController additionally cancels the underlying work
    // so handleBootstrap doesn't zombie after the timeout fires.
    return await Promise.race([
      handleBootstrap(req, ac.signal),
      new Promise<never>((_, reject) => {
        ac.signal.addEventListener("abort", () => reject(new DOMException("bootstrap timeout", "AbortError")), { once: true });
      })
    ]);
  } catch (error) {
    if (ac.signal.aborted) {
      console.warn("MM bootstrap: timed out after 30s");
      return NextResponse.json({ error: "bootstrap timed out" }, { status: 504 });
    }
    console.error("MM bootstrap: unexpected top-level error", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}

async function handleBootstrap(req: Request, signal: AbortSignal): Promise<NextResponse> {
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

    signal.throwIfAborted();

    // 4) Hive subscriptions — use a per-request QueryClient.
    //    Do NOT use the shared getQueryClient() here: React's cache() is
    //    scoped to Server Components, not Route Handlers. In a long-lived
    //    container the shared QueryClient persists across requests, serving
    //    stale subscription data that causes auto-joining to unsubscribed communities.
    let subscriptions: Subscription[] = [];
    const qc = new QueryClient();
    try {
        subscriptions =
          (await qc.fetchQuery(
            getAccountSubscriptionsQueryOptions(username)
          )) || [];
    } catch (error) {
        console.error("MM bootstrap: Unable to load Hive/Ecency subscriptions", error);
    } finally {
        qc.clear();
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

    // 5) Join channels for communities the user is subscribed to
    //    Skip channels the user has manually left (respect user choice)
    const BATCH_SIZE = 5;

    let leftChannels = new Set<string>();
    try {
      const userWithProps = await getMattermostUserWithProps(user.id);
      leftChannels = getUserLeftChannels(userWithProps);
    } catch (e) {
      console.warn("MM bootstrap: failed to load left channels", { username, error: e });
    }

    signal.throwIfAborted();

    // Ensure channels exist and join for all subscribed communities
    const communityEntries = Array.from(uniqueCommunityIds);
    const channelResults: PromiseSettledResult<{ communityId: string; channelId: string }>[] = [];

    for (let i = 0; i < communityEntries.length; i += BATCH_SIZE) {
      signal.throwIfAborted();
      const batch = communityEntries.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async ([communityId, title]) => {
          const normalizedId = communityId.trim().toLowerCase();
          // Skip auto-join if user manually left this channel
          const shouldAutoJoin = !leftChannels.has(normalizedId);
          try {
            const ensuredChannelId = await ensureCommunityChannelMembership(
              user.id,
              communityId,
              title,
              shouldAutoJoin
            );
            return { communityId, channelId: ensuredChannelId };
          } catch (err) {
            throw Object.assign(err instanceof Error ? err : new Error(String(err)), { communityId });
          }
        })
      );
      channelResults.push(...batchResults);
    }
    const failedChannels = channelResults.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    if (failedChannels.length > 0) {
      const failedIds = failedChannels.map(r => r.reason?.communityId ?? r.reason?.message ?? "unknown");
      console.warn("MM bootstrap: some channels failed", { username, count: failedChannels.length, failedIds });
    }

    // For explicitly requested community, always auto-join the user
    // and clear the left-channel record since this is an intentional join
    if (community) {
      try {
        channelId = await ensureCommunityChannelMembership(
          user.id,
          community,
          communityTitle || displayName || community,
          true
        );
        const normalizedCommunity = community.trim().toLowerCase();
        if (leftChannels.has(normalizedCommunity)) {
          await removeUserLeftChannel(user.id, normalizedCommunity).catch(() => {});
        }
      } catch (e) {
        console.warn("MM bootstrap: explicit community join failed", { username, community, error: e });
      }
    }

    const response = NextResponse.json({
        ok: true,
        userId: user.id,
        channelId,
        token: personalToken
    });
    return withMattermostTokenCookie(response, personalToken);
}
