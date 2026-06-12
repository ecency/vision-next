import { NextResponse } from "next/server";

import {
  deleteMattermostPostsByUserAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  requireMattermostSuperAdmin
} from "@/server/mattermost";

export async function DELETE(
  _req: Request,
  { params }: { params: { username: string } }
): Promise<NextResponse<{ deleted: number } | { error: string }>> {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const guard = await requireMattermostSuperAdmin(token);
    if (guard.response) {
      return guard.response;
    }

    const { deleted } = await deleteMattermostPostsByUserAsAdmin(params.username);

    return NextResponse.json({ deleted });
  } catch (error) {
    return handleMattermostError(error);
  }
}
