import { NextResponse } from "next/server";
import { getMattermostTokenFromCookies, mmUserFetch } from "@/server/mattermost";

export async function GET() {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const channels = await mmUserFetch<
      { id: string; name: string; display_name: string; type: string }[]
    >(`/users/me/channels?page=0&per_page=200`, token);

    return NextResponse.json({ channels });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
