"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "./set-session";

/**
 * Server Action to revalidate entry pages after publishing/editing
 *
 * AUTHENTICATION REQUIRED: This action verifies the cryptographically signed
 * session token to authenticate the user, then checks that the authenticated
 * user is the author of the entry before revalidating.
 *
 * Security:
 * - Uses HMAC-SHA256 signed session tokens (cannot be forged)
 * - Verifies session signature and expiration
 * - Checks ownership (user must be post author)
 * - Logs unauthorized attempts
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
    // Authenticate: Verify cryptographically signed session token
    // This cannot be forged by the client due to HMAC signature
    const authenticatedUsername = await getSessionUser();

    if (!authenticatedUsername) {
      console.error("Revalidate attempt with invalid or missing session token");
      return {
        success: false,
        error: "Unauthorized: Invalid or expired session"
      };
    }

    // Authorize: Verify the authenticated user is the post author
    // On Hive blockchain, only the original author can edit their posts
    if (authenticatedUsername !== author) {
      console.error(
        `Unauthorized revalidate attempt: user "${authenticatedUsername}" tried to revalidate post by "${author}"`
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
