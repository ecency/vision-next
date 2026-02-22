import { Operation } from "@hiveio/dhive";

/**
 * Social Operations
 * Operations for following, muting, and managing social relationships
 */

/**
 * Builds a follow operation (custom_json).
 * @param follower - Account following
 * @param following - Account to follow
 * @returns Custom JSON operation for follow
 */
export function buildFollowOp(follower: string, following: string): Operation {
  if (!follower || !following) {
    throw new Error("[SDK][buildFollowOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "follow",
      json: JSON.stringify([
        "follow",
        {
          follower,
          following,
          what: ["blog"],
        },
      ]),
      required_auths: [],
      required_posting_auths: [follower],
    },
  ];
}

/**
 * Builds an unfollow operation (custom_json).
 * @param follower - Account unfollowing
 * @param following - Account to unfollow
 * @returns Custom JSON operation for unfollow
 */
export function buildUnfollowOp(follower: string, following: string): Operation {
  if (!follower || !following) {
    throw new Error("[SDK][buildUnfollowOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "follow",
      json: JSON.stringify([
        "follow",
        {
          follower,
          following,
          what: [],
        },
      ]),
      required_auths: [],
      required_posting_auths: [follower],
    },
  ];
}

/**
 * Builds an ignore/mute operation (custom_json).
 * @param follower - Account ignoring
 * @param following - Account to ignore
 * @returns Custom JSON operation for ignore
 */
export function buildIgnoreOp(follower: string, following: string): Operation {
  if (!follower || !following) {
    throw new Error("[SDK][buildIgnoreOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "follow",
      json: JSON.stringify([
        "follow",
        {
          follower,
          following,
          what: ["ignore"],
        },
      ]),
      required_auths: [],
      required_posting_auths: [follower],
    },
  ];
}

/**
 * Builds an unignore/unmute operation (custom_json).
 * @param follower - Account unignoring
 * @param following - Account to unignore
 * @returns Custom JSON operation for unignore
 */
export function buildUnignoreOp(follower: string, following: string): Operation {
  if (!follower || !following) {
    throw new Error("[SDK][buildUnignoreOp] Missing required parameters");
  }

  return buildUnfollowOp(follower, following);
}

/**
 * Builds a Hive Notify set last read operation (custom_json).
 * @param username - Account setting last read
 * @param date - ISO date string (defaults to now)
 * @returns Array of custom JSON operations for setting last read
 */
export function buildSetLastReadOps(username: string, date?: string): Operation[] {
  if (!username) {
    throw new Error("[SDK][buildSetLastReadOps] Missing required parameters");
  }

  const lastReadDate = date || new Date().toISOString().split(".")[0];

  const notifyOp: Operation = [
    "custom_json",
    {
      id: "notify",
      json: JSON.stringify(["setLastRead", { date: lastReadDate }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];

  const ecencyNotifyOp: Operation = [
    "custom_json",
    {
      id: "ecency_notify",
      json: JSON.stringify(["setLastRead", { date: lastReadDate }]),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];

  return [notifyOp, ecencyNotifyOp];
}
