/**
 * Trigger on-demand revalidation for an entry page after publishing/editing
 * This ensures users see their updates immediately instead of waiting for ISR revalidation
 */
export async function revalidateEntry(author: string, permlink: string) {
  try {
    const response = await fetch("/api/revalidate-entry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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
