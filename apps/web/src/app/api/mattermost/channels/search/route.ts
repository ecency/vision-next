import { NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  handleMattermostError,
  isMattermostUnauthorizedError,
  mmUserFetch
} from "@/server/mattermost";
import { isMattermostDefaultChannel } from "../helpers";

interface MattermostChannelSummary {
  id: string;
  name: string;
  display_name: string;
  type: string;
}

interface ChannelSearchPayload {
  term?: string;
  public?: boolean;
  private?: boolean;
}

export async function POST(req: Request) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: ChannelSearchPayload = {};
  try {
    payload = (await req.json()) as ChannelSearchPayload;
  } catch (error) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const query = payload.term?.trim() || "";
  const includePublic = payload.public ?? true;
  const includePrivate = payload.private ?? true;

  if (query.length < 2) {
    return NextResponse.json({ channels: [] });
  }

  try {
    const teamId = getMattermostTeamId();
    const channels = await mmUserFetch<MattermostChannelSummary[]>(
      `/teams/${teamId}/channels/search`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          term: query,
          public: includePublic,
          private: includePrivate
        })
      }
    );

    // Keep search in sync with the channel list: the team defaults are hidden
    // there, so surfacing them here would let a user open a channel that then
    // disappears from their sidebar. Their display names can also collide with
    // a real community channel, making the two results indistinguishable.
    return NextResponse.json({
      channels: (channels || []).filter((channel) => !isMattermostDefaultChannel(channel))
    });
  } catch (error) {
    if (isMattermostUnauthorizedError(error)) {
      return handleMattermostError(error);
    }

    if (error instanceof Error && error.message.includes("(400)")) {
      // Mattermost responds with a 400 when the search payload is rejected.
      // Instead of surfacing an error to the user, just return no results.
      return NextResponse.json({ channels: [] });
    }

    return handleMattermostError(error);
  }
}
