import { NextRequest, NextResponse } from "next/server";
import { getMattermostTokenFromCookies, handleMattermostError, mmUserFetch } from "@/server/mattermost";

interface MattermostChannelModeration {
  name: string;
  roles: string[];
  schemes?: Record<string, string>;
}

export async function GET(_request: NextRequest, { params }: { params: { channelId: string } }) {
  const token = await getMattermostTokenFromCookies();

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const moderation = await mmUserFetch<MattermostChannelModeration[]>(
      `/channels/${params.channelId}/moderation`,
      token
    );

    return NextResponse.json({ moderation });
  } catch (error) {
    return handleMattermostError(error);
  }
}
