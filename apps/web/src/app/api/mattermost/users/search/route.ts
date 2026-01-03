import { NextRequest, NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch,
  MattermostUser
} from "@/server/mattermost";

interface MattermostSearchUser extends MattermostUser {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  last_picture_update?: number;
}

export async function GET(req: NextRequest) {
  const token = await getMattermostTokenFromCookies();

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const term = req.nextUrl.searchParams.get("q")?.trim() || "";

  if (term.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const teamId = getMattermostTeamId();
    const users = await mmUserFetch<MattermostSearchUser[]>(`/users/search`, token, {
      method: "POST",
      body: JSON.stringify({
        term,
        team_id: teamId,
        limit: 20
      })
    });

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        nickname: user.nickname,
        last_picture_update: user.last_picture_update
      }))
    });
  } catch (error) {
    return handleMattermostError(error);
  }
}
