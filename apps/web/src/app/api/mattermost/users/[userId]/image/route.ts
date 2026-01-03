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

  const res = await fetch(`${baseUrl}/users/${params.userId}/image`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

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
