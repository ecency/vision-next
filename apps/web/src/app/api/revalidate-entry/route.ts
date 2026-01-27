import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
    return NextResponse.json(
      { error: "Error revalidating" },
      { status: 500 }
    );
  }
}
