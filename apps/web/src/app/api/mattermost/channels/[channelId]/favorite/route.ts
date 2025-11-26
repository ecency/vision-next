import { NextRequest, NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

interface MattermostChannelCategory {
  id: string;
  user_id: string;
  team_id: string;
  sort_order: number;
  sorting: "" | "recent";
  type: "favorites" | "channels" | "direct_messages";
  display_name: string;
  muted: boolean;
  collapsed: boolean;
  channel_ids: string[];
}

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { favorite = true } = (await req.json().catch(() => ({}))) as { favorite?: boolean };

  try {
    const currentUser = await mmUserFetch<{ id: string }>(`/users/me`, token);
    const teamId = getMattermostTeamId();

    const { categories = [] } = await mmUserFetch<{
      categories?: MattermostChannelCategory[];
    }>(`/users/${currentUser.id}/teams/${teamId}/channels/categories`, token);

    const favoritesCategoryId = `favorites_${currentUser.id}_${teamId}`;
    const channelsCategoryId = `channels_${currentUser.id}_${teamId}`;

    const categoriesById = new Map(categories.map((category) => [category.id, category]));

    const favoritesCategory =
      categoriesById.get(favoritesCategoryId) ||
      categories.find((category) => category.type === "favorites");

    const channelsCategory =
      categoriesById.get(channelsCategoryId) ||
      categories.find((category) => category.type === "channels");

    const updatedCategories = categories.map((category) => ({
      ...category,
      channel_ids: category.channel_ids.filter((id) => id !== params.channelId)
    }));

    if (favorite) {
      const favCategory: MattermostChannelCategory =
        favoritesCategory || {
          id: favoritesCategoryId,
          user_id: currentUser.id,
          team_id: teamId,
          sort_order: 0,
          sorting: "",
          type: "favorites",
          display_name: "Favorites",
          muted: false,
          collapsed: false,
          channel_ids: []
        };

      favCategory.channel_ids = [params.channelId, ...favCategory.channel_ids.filter((id) => id !== params.channelId)];

      if (!favoritesCategory) {
        updatedCategories.push(favCategory);
      } else {
        const index = updatedCategories.findIndex((category) => category.id === favCategory.id);
        if (index >= 0) {
          updatedCategories[index] = favCategory;
        }
      }
    } else {
      const channelCategory: MattermostChannelCategory =
        channelsCategory || {
          id: channelsCategoryId,
          user_id: currentUser.id,
          team_id: teamId,
          sort_order: 10,
          sorting: "",
          type: "channels",
          display_name: "Channels",
          muted: false,
          collapsed: false,
          channel_ids: []
        };

      if (!channelCategory.channel_ids.includes(params.channelId)) {
        channelCategory.channel_ids = [params.channelId, ...channelCategory.channel_ids];
      }

      if (!channelsCategory) {
        updatedCategories.push(channelCategory);
      } else {
        const index = updatedCategories.findIndex((category) => category.id === channelCategory.id);
        if (index >= 0) {
          updatedCategories[index] = channelCategory;
        }
      }
    }

    await mmUserFetch(`/users/${currentUser.id}/teams/${teamId}/channels/categories`, token, {
      method: "PUT",
      body: JSON.stringify(updatedCategories)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
