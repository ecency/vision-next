import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { bridgeApiCall } from "@/api/bridge";
import { CommunityRole, ROLES } from "@ecency/sdk";

const MATTERMOST_BASE_URL = process.env.MATTERMOST_BASE_URL;
const MATTERMOST_ADMIN_TOKEN = process.env.MATTERMOST_ADMIN_TOKEN;
const MATTERMOST_TEAM_ID = process.env.MATTERMOST_TEAM_ID;
const MATTERMOST_TOKEN_COOKIE = "mm_pat";
export const CHAT_BAN_PROP = "ecency_chat_banned_until";

export interface MattermostUser {
  id: string;
  username: string;
  email: string;
}

export interface MattermostUserWithProps extends MattermostUser {
  props?: Record<string, string>;
}

export interface MattermostChannel {
  id: string;
  name: string;
  display_name: string;
  type: string;
}

class MattermostError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function getMattermostTeamId() {
  return requireEnv(MATTERMOST_TEAM_ID, "MATTERMOST_TEAM_ID");
}

function getAdminHeaders() {
  return {
    Authorization: `Bearer ${requireEnv(MATTERMOST_ADMIN_TOKEN, "MATTERMOST_ADMIN_TOKEN")}`,
    "Content-Type": "application/json"
  } as const;
}

async function mmFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = requireEnv(MATTERMOST_BASE_URL, "MATTERMOST_BASE_URL");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new MattermostError(`Mattermost request failed (${res.status}): ${text}`, res.status);
  }

  const text = await res.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function ensureMattermostUser(username: string): Promise<MattermostUser> {
  try {
    return await mmFetch<MattermostUser>(`/users/username/${username}`, {
      headers: getAdminHeaders()
    });
  } catch (error) {
    const email = `${username}+no-email@ecency.local`;
    return await mmFetch<MattermostUser>(`/users`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        username,
        email,
        password: `${username}${Date.now()}!Ecency`,
        allow_marketing: false
      })
    });
  }
}

export async function ensureUserInTeam(userId: string) {
  const teamId = requireEnv(MATTERMOST_TEAM_ID, "MATTERMOST_TEAM_ID");
  try {
    await mmFetch(`/teams/${teamId}/members/${userId}`, {
      headers: getAdminHeaders()
    });
  } catch (error) {
    await mmFetch(`/teams/${teamId}/members`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ team_id: teamId, user_id: userId })
    });
  }
}

export async function followMattermostThreadForUser(
  userId: string,
  threadId: string,
  following = true
) {
  const teamId = getMattermostTeamId();

  try {
    await mmFetch(`/users/${userId}/teams/${teamId}/threads/${threadId}/following`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify({ following })
    });
  } catch (error) {
    console.error(
      `Unable to update Mattermost thread following for user ${userId} and thread ${threadId}`,
      error
    );
  }
}

function normalizeCommunityId(community: string) {
  return community.trim().toLowerCase();
}

export async function ensureChannelForCommunity(
  community: string,
  displayName?: string
): Promise<string> {
  const teamId = requireEnv(MATTERMOST_TEAM_ID, "MATTERMOST_TEAM_ID");
  const channelName = normalizeCommunityId(community);
  try {
    const existing = await mmFetch<{ id: string }>(`/teams/${teamId}/channels/name/${channelName}`, {
      headers: getAdminHeaders()
    });
    return existing.id;
  } catch (error) {
    const created = await mmFetch<{ id: string }>(`/channels`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        team_id: teamId,
        name: channelName,
        display_name: displayName || community,
        type: "O"
      })
    });
    return created.id;
  }
}

export async function ensureCommunityChannelMembership(
  userId: string,
  community: string,
  displayName?: string
) {
  const channelId = await ensureChannelForCommunity(community, displayName);
  await ensureUserInChannel(userId, channelId);
  return channelId;
}

export async function ensureUserInChannel(userId: string, channelId: string) {
  try {
    await mmFetch(`/channels/${channelId}/members/${userId}`, {
      headers: getAdminHeaders()
    });
  } catch (error) {
    await mmFetch(`/channels/${channelId}/members`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ channel_id: channelId, user_id: userId })
    });
  }
}

export async function findMattermostUser(username: string): Promise<MattermostUser | null> {
  try {
    return await mmFetch<MattermostUser>(`/users/username/${username}`, {
      headers: getAdminHeaders()
    });
  } catch (error) {
    return null;
  }
}

export async function getMattermostUserWithProps(userId: string): Promise<MattermostUserWithProps> {
  return await mmFetch<MattermostUserWithProps>(`/users/${userId}`, {
    headers: getAdminHeaders()
  });
}

async function getExistingToken(userId: string): Promise<string | null> {
  try {
    const tokens = await mmFetch<{ id: string; token: string; description: string }[]>(
      `/users/${userId}/tokens`,
      {
        headers: getAdminHeaders()
      }
    );
    const existing = tokens.find((t) => t.description === "ecency-auto");
    return existing?.token || null;
  } catch (error) {
    return null;
  }
}

async function createToken(userId: string): Promise<string> {
  const token = await mmFetch<{ token: string }>(`/users/${userId}/tokens`, {
    method: "POST",
    headers: getAdminHeaders(),
    body: JSON.stringify({ description: "ecency-auto" })
  });
  return token.token;
}

export async function ensurePersonalToken(userId: string): Promise<string> {
  const existing = await getExistingToken(userId);
  if (existing) {
    return existing;
  }
  return await createToken(userId);
}

export function withMattermostTokenCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: MATTERMOST_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}

export async function getMattermostTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(MATTERMOST_TOKEN_COOKIE)?.value || null;
}

export async function mmUserFetch<T>(path: string, token: string, init?: RequestInit) {
  return await mmFetch<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });
}

export function isMattermostUnauthorizedError(error: unknown) {
  return error instanceof MattermostError && (error.status === 401 || error.status === 403);
}

export function handleMattermostError(error: unknown) {
  if (isMattermostUnauthorizedError(error)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : "unknown error";

  if (error instanceof MattermostError) {
    return NextResponse.json({ error: message }, { status: error.status });
  }

  return NextResponse.json({ error: message }, { status: 500 });
}

const COMMUNITY_CHANNEL_NAME_PATTERN = /^hive-[a-z0-9-]+$/;

function isCommunityModerator(role: CommunityRole | undefined) {
  return role === ROLES.OWNER || role === ROLES.ADMIN || role === ROLES.MOD;
}

export async function getMattermostCommunityModerationContext(token: string, channelId: string) {
  const [channel, currentUser] = await Promise.all([
    mmUserFetch<MattermostChannel>(`/channels/${channelId}`, token),
    mmUserFetch<MattermostUser>(`/users/me`, token)
  ]);

  const isCommunityChannel =
    channel.type === "O" && normalizeCommunityId(channel.name) === channel.name &&
    COMMUNITY_CHANNEL_NAME_PATTERN.test(channel.name);

  if (!isCommunityChannel) {
    return {
      channel,
      currentUser,
      community: null,
      canModerate: false as const
    };
  }

  try {
    const context = await bridgeApiCall<{ role?: CommunityRole }>("get_community_context", {
      account: currentUser.username,
      name: channel.name
    });

    return {
      channel,
      currentUser,
      community: channel.name,
      canModerate: isCommunityModerator(context?.role)
    };
  } catch (error) {
    console.error("Unable to load community context for chat moderation", error);
    return {
      channel,
      currentUser,
      community: channel.name,
      canModerate: false as const
    };
  }
}

export async function deleteMattermostPostAsAdmin(postId: string) {
  await mmFetch(`/posts/${postId}`, {
    method: "DELETE",
    headers: getAdminHeaders()
  });
}

export function isUserChatBanned(user: Pick<MattermostUserWithProps, "props">) {
  const bannedUntil = user.props?.[CHAT_BAN_PROP];
  const expiration = Number(bannedUntil);

  if (!bannedUntil || Number.isNaN(expiration)) {
    return null;
  }

  if (expiration <= Date.now()) {
    return null;
  }

  return expiration;
}

async function searchMattermostPostsByUserAsAdmin(username: string, page: number, perPage: number) {
  const teamId = getMattermostTeamId();

  return mmFetch<{ order: string[]; posts: Record<string, any> }>(`/teams/${teamId}/posts/search`, {
    method: "POST",
    headers: getAdminHeaders(),
    body: JSON.stringify({
      terms: `from:${username}`,
      is_or_search: false,
      include_deleted_channels: true,
      per_page: perPage,
      page
    })
  });
}

export async function deleteMattermostPostsByUserAsAdmin(username: string) {
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  const targetUser = await findMattermostUser(normalizedUsername);

  if (!targetUser) {
    throw new MattermostError(`User @${normalizedUsername} not found`, 404);
  }

  const perPage = 200;
  let deleted = 0;

  // Continue searching from the first page until no more posts remain for the target user.
  while (true) {
    const { order, posts } = await searchMattermostPostsByUserAsAdmin(targetUser.username, 0, perPage);
    const postsToDelete = (order || []).map((id) => posts[id]).filter(Boolean);

    if (!postsToDelete.length) {
      break;
    }

    for (const post of postsToDelete) {
      await deleteMattermostPostAsAdmin(post.id);
      deleted += 1;
    }
  }

  return { deleted, user: targetUser } as const;
}

export async function banMattermostUserForHoursAsAdmin(username: string, hours: number) {
  if (Number.isNaN(hours) || !Number.isFinite(hours)) {
    throw new MattermostError("hours must be a finite number", 400);
  }

  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  const targetUser = await findMattermostUser(normalizedUsername);

  if (!targetUser) {
    throw new MattermostError(`User @${normalizedUsername} not found`, 404);
  }

  const adminUser = await getMattermostUserWithProps(targetUser.id);
  const props = { ...(adminUser.props || {}) };

  const expiration = hours > 0 ? Date.now() + hours * 60 * 60 * 1000 : null;

  if (expiration) {
    props[CHAT_BAN_PROP] = String(expiration);
  } else {
    delete props[CHAT_BAN_PROP];
  }

  await mmFetch(`/users/${adminUser.id}/patch`, {
    method: "PUT",
    headers: getAdminHeaders(),
    body: JSON.stringify({ props })
  });

  return { user: targetUser, bannedUntil: expiration } as const;
}
