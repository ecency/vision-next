import { NextResponse } from "next/server";
import {
  MattermostUser,
  nukeUserCompletelyAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

const CHAT_SUPER_ADMIN = "ecency";

/**
 * Nuclear option: Deletes all messages (public + DMs) and permanently removes the user account.
 * Use this for handling abusive users where you need to completely remove their presence.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { username: string } }
): Promise<
  NextResponse<
    | {
        username: string;
        deletedPublicPosts: number;
        deletedDmPosts: number;
        accountDeleted: boolean;
      }
    | { error: string }
  >
> {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>("/users/me", token);

    if (currentUser.username !== CHAT_SUPER_ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const result = await nukeUserCompletelyAsAdmin(params.username);

    return NextResponse.json({
      username: result.username,
      deletedPublicPosts: result.deletedPublicPosts,
      deletedDmPosts: result.deletedDmPosts,
      accountDeleted: result.accountDeleted
    });
  } catch (error) {
    return handleMattermostError(error);
  }
}
