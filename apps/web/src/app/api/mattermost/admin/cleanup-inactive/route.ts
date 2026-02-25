import { NextResponse } from "next/server";
import {
  MattermostUser,
  cleanupInactiveMattermostUsers,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

export const maxDuration = 300;

const CHAT_SUPER_ADMIN = process.env.MATTERMOST_SUPER_ADMIN ?? "ecency";

export async function POST(req: Request) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>("/users/me", token);

    if (currentUser.username !== CHAT_SUPER_ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    let body: { inactiveDays?: number } = {};
    const raw = await req.text();
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        return NextResponse.json({ error: "malformed JSON body" }, { status: 400 });
      }
    }

    const rawDays = body.inactiveDays;
    if (rawDays !== undefined && (typeof rawDays !== "number" || rawDays < 1)) {
      return NextResponse.json({ error: "inactiveDays must be a positive number" }, { status: 400 });
    }
    const inactiveDays = rawDays ?? 60;
    const result = await cleanupInactiveMattermostUsers(inactiveDays);

    return NextResponse.json(result);
  } catch (error) {
    return handleMattermostError(error);
  }
}
