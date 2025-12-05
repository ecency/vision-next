import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  const token = await getMattermostTokenFromCookies();

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const ids = await request.json();
    const users = await mmUserFetch<MattermostUser[]>("/users/ids", token, {
      method: "POST",
      body: JSON.stringify(ids)
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleMattermostError(error);
  }
}
