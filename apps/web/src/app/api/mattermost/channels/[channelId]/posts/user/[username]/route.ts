import { NextRequest, NextResponse } from "next/server";
import {
  handleMattermostError,
  deleteMattermostDmPostsByUserAsAdmin
} from "@/server/mattermost";

interface RouteParams {
  params: Promise<{
    channelId: string;
    username: string;
  }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { username } = await params;

    const result = await deleteMattermostDmPostsByUserAsAdmin(username);

    return NextResponse.json(result);
  } catch (error) {
    return handleMattermostError(error);
  }
}
