import { NextResponse } from "next/server";
import {
  deleteMattermostDmPostsByUserAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  requireMattermostSuperAdmin
} from "@/server/mattermost";

/**
 * Deletes only DM and group message posts by a user.
 * Does NOT delete posts in public/community channels.
 * Does NOT delete the user account.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { username: string } }
): Promise<NextResponse<{ deleted: number; dmOnly: boolean; timedOut?: boolean } | { error: string }>> {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const guard = await requireMattermostSuperAdmin(token);
    if (guard.response) {
      return guard.response;
    }

    const { deleted, dmOnly, timedOut } = await deleteMattermostDmPostsByUserAsAdmin(params.username);

    return NextResponse.json({ deleted, dmOnly, timedOut });
  } catch (error) {
    return handleMattermostError(error);
  }
}
