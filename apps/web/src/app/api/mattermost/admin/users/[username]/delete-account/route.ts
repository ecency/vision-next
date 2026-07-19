import { NextResponse } from "next/server";
import {
  deleteMattermostUserAccountAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  requireMattermostSuperAdmin
} from "@/server/mattermost";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
): Promise<NextResponse<{ deleted: boolean; username: string } | { error: string }>> {
  const { username } = await params;
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const guard = await requireMattermostSuperAdmin(token);
    if (guard.response) {
      return guard.response;
    }

    const result = await deleteMattermostUserAccountAsAdmin(username);

    return NextResponse.json({
      deleted: result.deleted,
      deactivated: result.deactivated,
      username: result.username
    });
  } catch (error) {
    return handleMattermostError(error);
  }
}
