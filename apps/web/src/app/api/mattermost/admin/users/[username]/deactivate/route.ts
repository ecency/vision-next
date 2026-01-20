import { NextResponse } from "next/server";
import {
  MattermostUser,
  deactivateMattermostUserAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

const CHAT_SUPER_ADMIN = "ecency";

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
    const currentUser = await mmUserFetch<MattermostUser>("/users/me", token);

    if (currentUser.username !== CHAT_SUPER_ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { deactivated, username } = await deactivateMattermostUserAsAdmin(params.username);

    return NextResponse.json({ deactivated, username });
  } catch (error) {
    return handleMattermostError(error);
  }
}
