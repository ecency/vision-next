/**
 * Trigger on-demand revalidation for an entry page after publishing/editing
 * This ensures users see their updates immediately instead of waiting for ISR revalidation
 *
 * SECURITY NOTE: This function should be called from server-side code (Server Actions, API routes)
 * where the REVALIDATE_SECRET environment variable is available.
 * Do NOT call this from client components as it requires server-side authentication.
 *
 * For client-side usage, create a Server Action that wraps this function.
 */
export async function revalidateEntry(author: string, permlink: string) {
  try {
    const secret = process.env.REVALIDATE_SECRET;

    if (!secret) {
      console.error("REVALIDATE_SECRET environment variable not set");
      return false;
    }

    const response = await fetch("/api/revalidate-entry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret
      },
      body: JSON.stringify({ author, permlink })
    });

    if (!response.ok) {
      console.error("Failed to revalidate entry:", await response.text());
    }

    return response.ok;
  } catch (error) {
    console.error("Error triggering revalidation:", error);
    return false;
  }
}
