import { NextResponse } from "next/server";
import {
  banMattermostUserForHoursAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  requireMattermostSuperAdmin
} from "@/server/mattermost";

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
    const guard = await requireMattermostSuperAdmin(token);
    if (guard.response) {
      return guard.response;
    }

    const { bannedUntil } = await banMattermostUserForHoursAsAdmin(params.username, hours);

    return NextResponse.json({ bannedUntil });
  } catch (error) {
    return handleMattermostError(error);
  }
}
