import { NextRequest, NextResponse } from "next/server";
import {
  DmPrivacyLevel,
  getMattermostTokenFromCookies,
  getMattermostUserWithProps,
  getUserDmPrivacy,
  handleMattermostError,
  MattermostUser,
  mmUserFetch,
  setUserDmPrivacy
} from "@/server/mattermost";

export async function GET() {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);
    const userWithProps = await getMattermostUserWithProps(currentUser.id);
    const privacy = getUserDmPrivacy(userWithProps);

    return NextResponse.json({ privacy });
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function PUT(req: NextRequest) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const privacy = body.privacy as DmPrivacyLevel;

    if (!["all", "followers", "none"].includes(privacy)) {
      return NextResponse.json(
        { error: 'Privacy level must be "all", "followers", or "none"' },
        { status: 400 }
      );
    }

    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);
    await setUserDmPrivacy(currentUser.id, privacy);

    return NextResponse.json({ privacy });
  } catch (error) {
    return handleMattermostError(error);
  }
}
