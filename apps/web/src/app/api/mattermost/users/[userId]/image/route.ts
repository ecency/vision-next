import { NextRequest, NextResponse } from "next/server";
import { getMattermostTokenFromCookies } from "@/server/mattermost";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.MATTERMOST_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "MATTERMOST_BASE_URL not configured" }, { status: 500 });
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/users/${params.userId}/image`, {
      headers: { Authorization: `Bearer ${token}` },
      // Avatar fetches that hang would tie up Node connection slots and
      // contribute to the same kind of pile-up we saw on the Plausible
      // proxy path. 8s matches the CF Worker primary timeout — anything
      // slower has already been cut off at the edge.
      signal: AbortSignal.timeout(8000)
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      { error: isTimeout ? "avatar fetch timed out" : "avatar fetch failed" },
      { status: isTimeout ? 504 : 502 }
    );
  }

  if (!res.ok) {
    const message = await res.text();
    return NextResponse.json({ error: message || "unable to load avatar" }, { status: res.status });
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  return new NextResponse(buffer, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/png",
      "Cache-Control": "public, max-age=300"
    }
  });
}
