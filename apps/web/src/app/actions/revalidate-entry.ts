"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";

/**
 * Server Action to revalidate entry pages after publishing/editing
 *
 * AUTHENTICATION REQUIRED: This action verifies that the authenticated user
 * is the author of the entry before revalidating. Only the post author can
 * trigger revalidation of their own content.
 *
 * This ensures users see their updates immediately instead of waiting for ISR revalidation.
 *
 * @param author - The username of the post author
 * @param permlink - The post's permanent link
 * @returns Object with success status, paths revalidated, or error message
 */
export async function revalidateEntryAction(author: string, permlink: string) {
  if (!author || !permlink) {
    return { success: false, error: "Missing author or permlink" };
  }

  try {
    // Authenticate: Get current user from session cookie
    const cookieStore = await cookies();
    const activeUsername = cookieStore.get(ACTIVE_USER_COOKIE_NAME)?.value;

    if (!activeUsername) {
      console.error("Revalidate attempt without authentication");
      return {
        success: false,
        error: "Unauthorized: No active session"
      };
    }

    // Authorize: Verify the authenticated user is the post author
    // On Hive blockchain, only the original author can edit their posts
    if (activeUsername !== author) {
      console.error(
        `Unauthorized revalidate attempt: user "${activeUsername}" tried to revalidate post by "${author}"`
      );
      return {
        success: false,
        error: "Unauthorized: You can only revalidate your own posts"
      };
    }

    // Authorization passed - revalidate the entry page
    const paths = [
      `/entry/${author}/${permlink}`,
      `/@${author}/${permlink}`,
      // Add other possible URL patterns if needed
    ];

    for (const path of paths) {
      revalidatePath(path);
    }

    console.log(`Successfully revalidated entry: ${author}/${permlink}`);

    return {
      success: true,
      paths,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error revalidating entry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
