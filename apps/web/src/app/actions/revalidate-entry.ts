"use server";

import { revalidatePath } from "next/cache";

/**
 * Server Action to revalidate entry pages after publishing/editing
 * This ensures users see their updates immediately instead of waiting for ISR revalidation
 *
 * This is a Server Action that can be safely called from client components
 * without exposing any secrets or authentication tokens.
 */
export async function revalidateEntryAction(author: string, permlink: string) {
  if (!author || !permlink) {
    return { success: false, error: "Missing author or permlink" };
  }

  try {
    // Revalidate the specific entry page
    const paths = [
      `/entry/${author}/${permlink}`,
      `/@${author}/${permlink}`,
      // Add other possible URL patterns if needed
    ];

    for (const path of paths) {
      revalidatePath(path);
    }

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
