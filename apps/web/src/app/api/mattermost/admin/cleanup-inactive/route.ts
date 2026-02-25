import { NextResponse } from "next/server";
import {
  MattermostUser,
  cleanupInactiveMattermostUsers,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

const CHAT_SUPER_ADMIN = "ecency";

export async function POST(req: Request) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>("/users/me", token);

    if (currentUser.username !== CHAT_SUPER_ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    let body: { inactiveDays?: number } = {};
    try {
      body = await req.json();
    } catch {
      // empty body is fine, defaults will be used
    }

    const inactiveDays = body.inactiveDays ?? 60;
    const result = await cleanupInactiveMattermostUsers(inactiveDays);

    return NextResponse.json(result);
  } catch (error) {
    return handleMattermostError(error);
  }
}
