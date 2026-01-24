import { NextResponse } from "next/server";
import {
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch,
  MattermostChannel,
  MattermostUser
} from "@/server/mattermost";

export async function POST(_: Request, { params }: { params: Promise<{ channelId: string }> }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { channelId } = await params;
    const [channel, currentUser] = await Promise.all([
      mmUserFetch<MattermostChannel>(`/channels/${channelId}`, token),
      mmUserFetch<MattermostUser>(`/users/me`, token)
    ]);

    if (channel.type === "D") {
      // Mattermost "Close conversation" for DMs is a preference update, not a leave.
      await mmUserFetch(`/users/${currentUser.id}/preferences`, token, {
        method: "PUT",
        body: JSON.stringify([
          {
            user_id: currentUser.id,
            category: "direct_channel_show",
            name: channelId,
            value: "false"
          }
        ])
      });
    } else {
      await mmUserFetch(`/channels/${channelId}/members/me`, token, { method: "DELETE" });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
