import { NextResponse } from "next/server";
import {
  getMattermostCommunityModerationContext,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

export async function POST(_req: Request, { params }: { params: { channelId: string; postId: string } }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const moderation = await getMattermostCommunityModerationContext(token, params.channelId);

    // Check permissions based on channel type
    if (moderation.channel.type === "O") {
      // Public/community channel - only moderators can pin
      if (!moderation.canModerate) {
        return NextResponse.json(
          { error: "Only community moderators can pin messages in this channel." },
          { status: 403 }
        );
      }
    } else if (moderation.channel.type === "D" || moderation.channel.type === "G") {
      // Direct message or group message - check membership
      const member = await mmUserFetch(
        `/channels/${params.channelId}/members/me`,
        token
      ).catch(() => null);

      if (!member) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    // Pin the post via Mattermost API
    await mmUserFetch(`/posts/${params.postId}/pin`, token, {
      method: "POST"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { channelId: string; postId: string } }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const moderation = await getMattermostCommunityModerationContext(token, params.channelId);

    // Check permissions based on channel type
    if (moderation.channel.type === "O") {
      // Public/community channel - only moderators can unpin
      if (!moderation.canModerate) {
        return NextResponse.json(
          { error: "Only community moderators can unpin messages in this channel." },
          { status: 403 }
        );
      }
    } else if (moderation.channel.type === "D" || moderation.channel.type === "G") {
      // Direct message or group message - check membership
      const member = await mmUserFetch(
        `/channels/${params.channelId}/members/me`,
        token
      ).catch(() => null);

      if (!member) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    // Unpin the post via Mattermost API
    await mmUserFetch(`/posts/${params.postId}/unpin`, token, {
      method: "POST"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
