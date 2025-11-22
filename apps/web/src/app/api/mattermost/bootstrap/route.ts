import { NextResponse } from "next/server";
import {
  ensureChannelForCommunity,
  ensureMattermostUser,
  ensurePersonalToken,
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

    let channelId: string | null = null;
    if (community) {
      channelId = await ensureChannelForCommunity(community, displayName);
    }

    const response = NextResponse.json({ ok: true, userId: user.id, channelId });
    return withMattermostTokenCookie(response, token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
