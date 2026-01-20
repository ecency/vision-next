import { NextResponse } from "next/server";
import {
  MattermostUser,
  deleteMattermostUserAccountAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

const CHAT_SUPER_ADMIN = "ecency";

export async function DELETE(
  _req: Request,
  { params }: { params: { username: string } }
): Promise<NextResponse<{ deleted: boolean; username: string } | { error: string }>> {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>("/users/me", token);

    if (currentUser.username !== CHAT_SUPER_ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { deleted, username } = await deleteMattermostUserAccountAsAdmin(params.username);

    return NextResponse.json({ deleted, username });
  } catch (error) {
    return handleMattermostError(error);
  }
}
