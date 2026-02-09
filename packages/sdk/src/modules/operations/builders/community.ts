import { Operation } from "@hiveio/dhive";

/**
 * Community Operations
 * Operations for managing Hive communities
 */

/**
 * Builds a subscribe to community operation (custom_json).
 * @param username - Account subscribing
 * @param community - Community name (e.g., "hive-123456")
 * @returns Custom JSON operation for subscribe
 */
export function buildSubscribeOp(username: string, community: string): Operation {
  if (!username || !community) {
    throw new Error("[SDK][buildSubscribeOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["subscribe", { community }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];
}

/**
 * Builds an unsubscribe from community operation (custom_json).
 * @param username - Account unsubscribing
 * @param community - Community name (e.g., "hive-123456")
 * @returns Custom JSON operation for unsubscribe
 */
export function buildUnsubscribeOp(username: string, community: string): Operation {
  if (!username || !community) {
    throw new Error("[SDK][buildUnsubscribeOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["unsubscribe", { community }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];
}

/**
 * Builds a set user role in community operation (custom_json).
 * @param username - Account setting the role (must have permission)
 * @param community - Community name (e.g., "hive-123456")
 * @param account - Account to set role for
 * @param role - Role name (e.g., "admin", "mod", "member", "guest")
 * @returns Custom JSON operation for setRole
 */
export function buildSetRoleOp(
  username: string,
  community: string,
  account: string,
  role: string
): Operation {
  if (!username || !community || !account || !role) {
    throw new Error("[SDK][buildSetRoleOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["setRole", { community, account, role }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];
}

/**
 * Community properties for update
 */
export interface CommunityProps {
  title: string;
  about: string;
  lang: string;
  description: string;
  flag_text: string;
  is_nsfw: boolean;
}

/**
 * Builds an update community properties operation (custom_json).
 * @param username - Account updating (must be community admin)
 * @param community - Community name (e.g., "hive-123456")
 * @param props - Properties to update
 * @returns Custom JSON operation for updateProps
 */
export function buildUpdateCommunityOp(
  username: string,
  community: string,
  props: CommunityProps
): Operation {
  if (!username || !community || !props) {
    throw new Error("[SDK][buildUpdateCommunityOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["updateProps", { community, props }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];
}

/**
 * Builds a pin/unpin post in community operation (custom_json).
 * @param username - Account pinning (must have permission)
 * @param community - Community name (e.g., "hive-123456")
 * @param account - Post author
 * @param permlink - Post permlink
 * @param pin - True to pin, false to unpin
 * @returns Custom JSON operation for pinPost/unpinPost
 */
export function buildPinPostOp(
  username: string,
  community: string,
  account: string,
  permlink: string,
  pin: boolean
): Operation {
  if (!username || !community || !account || !permlink || pin === undefined) {
    throw new Error("[SDK][buildPinPostOp] Missing required parameters");
  }

  const action = pin ? "pinPost" : "unpinPost";

  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify([action, { community, account, permlink }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];
}

/**
 * Builds a mute/unmute post in community operation (custom_json).
 * @param username - Account muting (must have permission)
 * @param community - Community name (e.g., "hive-123456")
 * @param account - Post author
 * @param permlink - Post permlink
 * @param notes - Mute reason/notes
 * @param mute - True to mute, false to unmute
 * @returns Custom JSON operation for mutePost/unmutePost
 */
export function buildMutePostOp(
  username: string,
  community: string,
  account: string,
  permlink: string,
  notes: string,
  mute: boolean
): Operation {
  if (
    !username ||
    !community ||
    !account ||
    !permlink ||
    mute === undefined
  ) {
    throw new Error("[SDK][buildMutePostOp] Missing required parameters");
  }

  const action = mute ? "mutePost" : "unmutePost";

  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify([action, { community, account, permlink, notes }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];
}

/**
 * Builds a mute/unmute user in community operation (custom_json).
 * @param username - Account performing mute (must have permission)
 * @param community - Community name (e.g., "hive-123456")
 * @param account - Account to mute/unmute
 * @param notes - Mute reason/notes
 * @param mute - True to mute, false to unmute
 * @returns Custom JSON operation for muteUser/unmuteUser
 */
export function buildMuteUserOp(
  username: string,
  community: string,
  account: string,
  notes: string,
  mute: boolean
): Operation {
  if (!username || !community || !account || mute === undefined) {
    throw new Error("[SDK][buildMuteUserOp] Missing required parameters");
  }

  const action = mute ? "muteUser" : "unmuteUser";

  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify([action, { community, account, notes }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];
}

/**
 * Builds a flag post in community operation (custom_json).
 * @param username - Account flagging
 * @param community - Community name (e.g., "hive-123456")
 * @param account - Post author
 * @param permlink - Post permlink
 * @param notes - Flag reason/notes
 * @returns Custom JSON operation for flagPost
 */
export function buildFlagPostOp(
  username: string,
  community: string,
  account: string,
  permlink: string,
  notes: string
): Operation {
  if (!username || !community || !account || !permlink) {
    throw new Error("[SDK][buildFlagPostOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["flagPost", { community, account, permlink, notes }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];
}
