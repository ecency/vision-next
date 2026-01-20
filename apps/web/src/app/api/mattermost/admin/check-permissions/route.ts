import { NextResponse } from "next/server";
import { getMattermostTokenFromCookies, mmUserFetch, MattermostUser } from "@/server/mattermost";

const CHAT_SUPER_ADMIN = "ecency";

/**
 * Diagnostic endpoint to check if the current user has proper admin permissions.
 * Call this to verify Mattermost admin setup.
 */
export async function GET(_req: Request): Promise<
  NextResponse<
    | {
        isEcency: boolean;
        isSystemAdmin: boolean;
        username: string;
        roles: string;
        canDeleteUsers: boolean;
        canDeletePosts: boolean;
        message: string;
      }
    | { error: string }
  >
> {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized - no token" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>("/users/me", token);

    const isSystemAdmin = currentUser.roles?.includes("system_admin") ?? false;
    const isEcency = currentUser.username === CHAT_SUPER_ADMIN;

    let message = "";
    if (!isEcency) {
      message = `You are logged in as @${currentUser.username}, but admin tools require @ecency account.`;
    } else if (!isSystemAdmin) {
      message = `You are @ecency, but you need System Admin role in Mattermost. Current roles: ${currentUser.roles}`;
    } else {
      message = "✓ All permissions OK! You can use admin tools.";
    }

    return NextResponse.json({
      isEcency,
      isSystemAdmin,
      username: currentUser.username,
      roles: currentUser.roles || "none",
      canDeleteUsers: isEcency && isSystemAdmin,
      canDeletePosts: isEcency && isSystemAdmin,
      message
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to check permissions: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}
