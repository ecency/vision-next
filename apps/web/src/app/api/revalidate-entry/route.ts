import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * API Route for on-demand revalidation of entry pages
 *
 * INTENDED USE: Server-to-server calls only (webhooks, external services, etc.)
 * Requires REVALIDATE_SECRET environment variable for authentication.
 *
 * For client-side revalidation after publishing/editing posts, use the
 * revalidateEntryAction Server Action instead, which has proper session-based
 * authentication and authorization.
 *
 * @see /app/actions/revalidate-entry.ts for the recommended approach
 */
export async function POST(request: NextRequest) {
  // Security: Verify revalidation secret to prevent abuse
  const revalidateSecret = process.env.REVALIDATE_SECRET;
  const authHeader = request.headers.get("x-revalidate-secret") || request.headers.get("authorization")?.replace("Bearer ", "");

  if (!revalidateSecret || authHeader !== revalidateSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { author, permlink } = body;

    if (!author || !permlink) {
      return NextResponse.json(
        { error: "Missing author or permlink" },
        { status: 400 }
      );
    }

    // Revalidate the specific entry page
    // This will regenerate the static page immediately
    const paths = [
      `/entry/${author}/${permlink}`,
      `/@${author}/${permlink}`,
      // Add other possible URL patterns if needed
    ];

    for (const path of paths) {
      revalidatePath(path);
    }

    return NextResponse.json({
      revalidated: true,
      paths,
      now: Date.now()
    });
  } catch (err) {
    console.error("Error revalidating entry via API route:", err);
    return NextResponse.json(
      { error: "Error revalidating" },
      { status: 500 }
    );
  }
}
