import { NextResponse } from "next/server";
import {
  nukeUserCompletelyAsAdmin,
  getMattermostTokenFromCookies,
  handleMattermostError,
  requireMattermostSuperAdmin
} from "@/server/mattermost";

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
    const guard = await requireMattermostSuperAdmin(token);
    if (guard.response) {
      return guard.response;
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
