import { NextRequest, NextResponse } from "next/server";
import { getMattermostTokenFromCookies, handleMattermostError, mmUserFetch } from "@/server/mattermost";

interface MattermostUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  delete_at?: number;
  last_picture_update?: number;
}

export async function POST(request: NextRequest) {
  const token = await getMattermostTokenFromCookies();

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let ids: unknown;
  try {
    ids = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  try {
    const users = await mmUserFetch<MattermostUser[]>("/users/ids", token, {
      method: "POST",
      body: JSON.stringify(ids)
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleMattermostError(error);
  }
}
