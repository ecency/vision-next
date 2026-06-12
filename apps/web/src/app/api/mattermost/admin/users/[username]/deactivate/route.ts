import { NextResponse } from "next/server";
import {
  deactivateMattermostUserAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  requireMattermostSuperAdmin
} from "@/server/mattermost";

/**
 * Deactivates a user account (Team Edition compatible).
 * Unlike permanent deletion, this works in Team Edition and marks the user as inactive.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { username: string } }
): Promise<NextResponse<{ deactivated: boolean; username: string } | { error: string }>> {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const guard = await requireMattermostSuperAdmin(token);
    if (guard.response) {
      return guard.response;
    }

    const { deactivated, username } = await deactivateMattermostUserAsAdmin(params.username);

    return NextResponse.json({ deactivated, username });
  } catch (error) {
    return handleMattermostError(error);
  }
}
