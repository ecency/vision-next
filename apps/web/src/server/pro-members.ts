/**
 * Server-side Ecency Pro roster check. Fetches the private-api pro-members list and reports
 * whether a (already-lowercased) username is an active Pro member. Returns `null` when the
 * roster could not be fetched so callers can fail with a retryable 503 rather than wrongly
 * denying a real Pro member. Mirrors core/sdk-init host selection.
 */

const PRIVATE_API_HOST = process.env.INTERNAL_API_HOST || "https://ecency.com";

export async function isProRosterMember(username: string): Promise<boolean | null> {
  let res: Response;
  try {
    res = await fetch(`${PRIVATE_API_HOST}/private-api/pro-members`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    return null;
  }

  try {
    const data = await res.json();
    const members: unknown = data?.members;
    if (!Array.isArray(members)) {
      return null;
    }
    const roster = new Set(
      members.filter((m): m is string => typeof m === "string").map((m) => m.toLowerCase())
    );
    return roster.has(username.toLowerCase());
  } catch {
    return null;
  }
}
