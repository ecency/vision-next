import { NextResponse } from "next/server";
import {
  cleanupInactiveMattermostUsers,
  getMattermostTokenFromCookies,
  handleMattermostError,
  requireMattermostSuperAdmin
} from "@/server/mattermost";

export const maxDuration = 300;

export async function POST(req: Request) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const guard = await requireMattermostSuperAdmin(token);
    if (guard.response) {
      return guard.response;
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
