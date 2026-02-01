import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { bridgeApiCall } from "@ecency/sdk";
import { CommunityRole, ROLES } from "@ecency/sdk";

const MATTERMOST_BASE_URL = process.env.MATTERMOST_BASE_URL;
const MATTERMOST_ADMIN_TOKEN = process.env.MATTERMOST_ADMIN_TOKEN;
const MATTERMOST_TEAM_ID = process.env.MATTERMOST_TEAM_ID;
const MATTERMOST_TOKEN_COOKIE = "mm_pat";
export const CHAT_BAN_PROP = "ecency_chat_banned_until";
export const CHAT_DM_PRIVACY_PROP = "ecency_dm_privacy";

export type DmPrivacyLevel = "all" | "followers" | "none";

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
  displayName?: string,
  autoJoin: boolean = false
) {
  const channelId = await ensureChannelForCommunity(community, displayName);
  if (autoJoin) {
    await ensureUserInChannel(userId, channelId);
  }
  return channelId;
}

export async function ensureUserInChannel(userId: string, channelId: string) {
  try {
    // Check if user is currently a member
    await mmFetch(`/channels/${channelId}/members/${userId}`, {
      headers: getAdminHeaders()
    });
    // User is already a member, nothing to do
  } catch (error) {
    // User is not a member - add them to the channel
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

export function getUserDmPrivacy(user: Pick<MattermostUserWithProps, "props">): DmPrivacyLevel {
  const dmPrivacy = user.props?.[CHAT_DM_PRIVACY_PROP];
  if (dmPrivacy === "followers" || dmPrivacy === "none") {
    return dmPrivacy;
  }
  return "all"; // default: allow all DMs
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

export async function deleteMattermostDmPostsByUserAsAdmin(username: string, timeoutMs = 25000) {
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  const targetUser = await findMattermostUser(normalizedUsername);

  if (!targetUser) {
    throw new MattermostError(`User @${normalizedUsername} not found`, 404);
  }

  let deleted = 0;
  let timedOut = false;
  const startTime = Date.now();
  const teamId = getMattermostTeamId();

  // Helper to check if we should continue
  const shouldContinue = () => {
    if (Date.now() - startTime > timeoutMs) {
      timedOut = true;
      return false;
    }
    return true;
  };

  // Get all channels for the user (includes DMs and group messages)
  const channels = await mmFetch<Array<{ id: string; type: string; team_id: string }>>(
    `/users/${targetUser.id}/channels`,
    { headers: getAdminHeaders() }
  );

  // Filter to only DM channels (type: 'D') and group messages (type: 'G')
  const dmChannels = channels.filter((ch) => ch.type === "D" || ch.type === "G");

  // For each DM channel, get and delete all posts by the user
  channelLoop: for (const channel of dmChannels) {
    if (!shouldContinue()) break;

    let page = 0;
    const perPage = 200;

    while (shouldContinue()) {
      // Get posts in this channel
      const posts = await mmFetch<
        Array<{ id: string; user_id: string; channel_id: string }>
      >(`/channels/${channel.id}/posts?page=${page}&per_page=${perPage}`, {
        headers: getAdminHeaders()
      }).catch(() => ({ order: [], posts: {} }));

      // Extract posts array from the response
      const postsArray = Array.isArray(posts)
        ? posts
        : Object.values((posts as any).posts || {});

      // Filter to only posts by the target user
      const userPosts = postsArray.filter((post: any) => post.user_id === targetUser.id);

      if (userPosts.length === 0) {
        break; // No more posts by this user in this channel
      }

      // Delete posts in parallel batches for speed
      const BATCH_SIZE = 10;
      for (let i = 0; i < userPosts.length; i += BATCH_SIZE) {
        if (!shouldContinue()) break channelLoop;

        const batch = userPosts.slice(i, i + BATCH_SIZE);
        const deletePromises = batch.map(async (post) => {
          try {
            await deleteMattermostPostAsAdmin(post.id);
            return true;
          } catch (err) {
            return false; // Silent failure
          }
        });

        const results = await Promise.allSettled(deletePromises);
        deleted += results.filter((r) => r.status === "fulfilled" && r.value === true).length;
      }

      // If we got fewer posts than requested, we've reached the end
      if (postsArray.length < perPage) {
        break;
      }

      page += 1;
    }
  }

  return { deleted, user: targetUser, dmOnly: true, timedOut } as const;
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

export async function setUserDmPrivacy(userId: string, privacy: DmPrivacyLevel) {
  const user = await getMattermostUserWithProps(userId);
  const props = { ...(user.props || {}) };

  if (privacy === "all") {
    delete props[CHAT_DM_PRIVACY_PROP];
  } else {
    props[CHAT_DM_PRIVACY_PROP] = privacy;
  }

  await mmFetch(`/users/${userId}/patch`, {
    method: "PUT",
    headers: getAdminHeaders(),
    body: JSON.stringify({ props })
  });

  return privacy;
}

/**
 * Deactivates a Mattermost user account (Team Edition compatible).
 * This will:
 * - Mark user as inactive/deleted
 * - Prevent login
 * - Remove from channels
 * Note: Does NOT permanently delete data (requires Enterprise Edition)
 */
export async function deactivateMattermostUserAsAdmin(username: string) {
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  const targetUser = await findMattermostUser(normalizedUsername);

  if (!targetUser) {
    throw new MattermostError(`User @${normalizedUsername} not found`, 404);
  }

  // Deactivate user (Team Edition compatible)
  await mmFetch(`/users/${targetUser.id}`, {
    method: "DELETE",
    headers: getAdminHeaders()
  });

  return {
    deactivated: true,
    userId: targetUser.id,
    username: targetUser.username
  } as const;
}

/**
 * Permanently deletes a Mattermost user account and all associated data.
 * This is IRREVERSIBLE and will:
 * - Delete the user profile
 * - Remove user from all channels and DMs
 * - Delete all their posts (handled by Mattermost)
 * - Delete all uploaded files
 * - Remove all preferences and settings
 *
 * REQUIRES: Mattermost Enterprise Edition
 */
export async function deleteMattermostUserAccountAsAdmin(username: string) {
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  const targetUser = await findMattermostUser(normalizedUsername);

  if (!targetUser) {
    throw new MattermostError(`User @${normalizedUsername} not found`, 404);
  }

  try {
    // Try permanent deletion first (Enterprise Edition)
    await mmFetch(`/users/${targetUser.id}?permanent=true`, {
      method: "DELETE",
      headers: getAdminHeaders()
    });

    return {
      deleted: true,
      userId: targetUser.id,
      username: targetUser.username
    } as const;
  } catch (error) {
    // If permanent deletion fails, try deactivation (Team Edition fallback)
    const response = await deactivateMattermostUserAsAdmin(username);
    return {
      deleted: false,
      deactivated: true,
      userId: response.userId,
      username: response.username
    } as const;
  }
}

/**
 * Complete user removal: deletes all messages (including DMs) and then permanently deletes the account.
 * This is the nuclear option for handling abusive users.
 *
 * Steps:
 * 1. Delete all public/community channel messages
 * 2. Delete all DM and group message posts
 * 3. Permanently delete the user account
 *
 * Note: Mattermost's permanent user deletion will also remove posts, but we do it explicitly
 * first to ensure all messages are gone before the account is deleted.
 */
export async function nukeUserCompletelyAsAdmin(username: string) {
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  const targetUser = await findMattermostUser(normalizedUsername);

  if (!targetUser) {
    throw new MattermostError(`User @${normalizedUsername} not found`, 404);
  }

  const result = {
    username: targetUser.username,
    userId: targetUser.id,
    deletedPublicPosts: 0,
    deletedDmPosts: 0,
    accountDeleted: false
  };

  try {
    // Step 1: Delete all public/community posts
    const publicResult = await deleteMattermostPostsByUserAsAdmin(targetUser.username);
    result.deletedPublicPosts = publicResult.deleted;
  } catch (err) {
    // Continue anyway
  }

  try {
    // Step 2: Delete all DM and group message posts
    const dmResult = await deleteMattermostDmPostsByUserAsAdmin(targetUser.username);
    result.deletedDmPosts = dmResult.deleted;
  } catch (err) {
    // Continue anyway
  }

  try {
    // Step 3: Permanently delete the user account
    await deleteMattermostUserAccountAsAdmin(targetUser.username);
    result.accountDeleted = true;
  } catch (err) {
    throw err; // This is critical, so we throw
  }

  return result;
}
