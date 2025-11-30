import { NextResponse } from "next/server";

import {
  MattermostUser,
  deleteMattermostPostsByUserAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

const CHAT_SUPER_ADMIN = "ecency";

export async function DELETE(
  _req: Request,
  { params }: { params: { username: string } }
): Promise<NextResponse<{ deleted: number } | { error: string }>> {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>("/users/me", token);

    if (currentUser.username !== CHAT_SUPER_ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { deleted } = await deleteMattermostPostsByUserAsAdmin(params.username);

    return NextResponse.json({ deleted });
  } catch (error) {
    return handleMattermostError(error);
  }
}
