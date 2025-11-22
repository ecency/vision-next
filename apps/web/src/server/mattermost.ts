import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const MATTERMOST_BASE_URL = process.env.MATTERMOST_BASE_URL;
const MATTERMOST_ADMIN_TOKEN = process.env.MATTERMOST_ADMIN_TOKEN;
const MATTERMOST_TEAM_ID = process.env.MATTERMOST_TEAM_ID;
const MATTERMOST_TOKEN_COOKIE = "mm_pat";

export interface MattermostUser {
  id: string;
  username: string;
  email: string;
}

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
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
    throw new Error(`Mattermost request failed (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
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

export function getMattermostTokenFromCookies(): string | null {
  return cookies().get(MATTERMOST_TOKEN_COOKIE)?.value || null;
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
