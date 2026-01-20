import { NextResponse } from "next/server";
import {
  MattermostUser,
  deleteMattermostDmPostsByUserAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

const CHAT_SUPER_ADMIN = "ecency";

/**
 * Deletes only DM and group message posts by a user.
 * Does NOT delete posts in public/community channels.
 * Does NOT delete the user account.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { username: string } }
): Promise<NextResponse<{ deleted: number; dmOnly: boolean } | { error: string }>> {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>("/users/me", token);

    if (currentUser.username !== CHAT_SUPER_ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { deleted, dmOnly } = await deleteMattermostDmPostsByUserAsAdmin(params.username);

    return NextResponse.json({ deleted, dmOnly });
  } catch (error) {
    return handleMattermostError(error);
  }
}
