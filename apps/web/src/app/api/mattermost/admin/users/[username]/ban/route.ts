import { NextResponse } from "next/server";
import {
  MattermostUser,
  banMattermostUserForHoursAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

const CHAT_SUPER_ADMIN = "ecency";

export async function POST(
  req: Request,
  { params }: { params: { username: string } }
): Promise<NextResponse<{ bannedUntil: number | null } | { error: string }>> {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { hours?: number | string };
  const hours = Number(body.hours ?? 0);

  try {
    const currentUser = await mmUserFetch<MattermostUser>("/users/me", token);

    if (currentUser.username !== CHAT_SUPER_ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { bannedUntil } = await banMattermostUserForHoursAsAdmin(params.username, hours);

    return NextResponse.json({ bannedUntil });
  } catch (error) {
    return handleMattermostError(error);
  }
}
