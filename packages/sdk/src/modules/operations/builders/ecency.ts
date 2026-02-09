import { Operation } from "@hiveio/dhive";

/**
 * Ecency-Specific Operations
 * Custom operations for Ecency platform features (Points, Boost, Promote, etc.)
 */

/**
 * Builds an Ecency boost operation (custom_json with active authority).
 * @param user - User account
 * @param author - Post author
 * @param permlink - Post permlink
 * @param amount - Amount to boost (e.g., "1.000 POINT")
 * @returns Custom JSON operation for boost
 */
export function buildBoostOp(
  user: string,
  author: string,
  permlink: string,
  amount: string
): Operation {
  if (!user || !author || !permlink || !amount) {
    throw new Error("[SDK][buildBoostOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "ecency_boost",
      json: JSON.stringify({
        user,
        author,
        permlink,
        amount,
      }),
      required_auths: [user],
      required_posting_auths: [],
    },
  ];
}

/**
 * Builds an Ecency boost operation with numeric point value.
 * @param user - User account
 * @param author - Post author
 * @param permlink - Post permlink
 * @param points - Points to spend (will be formatted as "X.XXX POINT")
 * @returns Custom JSON operation for boost
 */
export function buildBoostOpWithPoints(
  user: string,
  author: string,
  permlink: string,
  points: number
): Operation {
  if (!user || !author || !permlink || points === undefined) {
    throw new Error("[SDK][buildBoostOpWithPoints] Missing required parameters");
  }

  return buildBoostOp(user, author, permlink, `${points.toFixed(3)} POINT`);
}

/**
 * Builds an Ecency Boost Plus subscription operation (custom_json).
 * @param user - User account
 * @param account - Account to subscribe
 * @param duration - Subscription duration in days
 * @returns Custom JSON operation for boost plus
 */
export function buildBoostPlusOp(
  user: string,
  account: string,
  duration: number
): Operation {
  if (!user || !account || duration === undefined) {
    throw new Error("[SDK][buildBoostPlusOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "ecency_boost_plus",
      json: JSON.stringify({
        user,
        account,
        duration,
      }),
      required_auths: [user],
      required_posting_auths: [],
    },
  ];
}

/**
 * Builds an Ecency promote operation (custom_json).
 * @param user - User account
 * @param author - Post author
 * @param permlink - Post permlink
 * @param duration - Promotion duration in days
 * @returns Custom JSON operation for promote
 */
export function buildPromoteOp(
  user: string,
  author: string,
  permlink: string,
  duration: number
): Operation {
  if (!user || !author || !permlink || duration === undefined) {
    throw new Error("[SDK][buildPromoteOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "ecency_promote",
      json: JSON.stringify({
        user,
        author,
        permlink,
        duration,
      }),
      required_auths: [user],
      required_posting_auths: [],
    },
  ];
}

/**
 * Builds an Ecency point transfer operation (custom_json).
 * @param sender - Sender account
 * @param receiver - Receiver account
 * @param amount - Amount to transfer
 * @param memo - Transfer memo
 * @returns Custom JSON operation for point transfer
 */
export function buildPointTransferOp(
  sender: string,
  receiver: string,
  amount: string,
  memo: string
): Operation {
  if (!sender || !receiver || !amount) {
    throw new Error("[SDK][buildPointTransferOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "ecency_point_transfer",
      json: JSON.stringify({
        sender,
        receiver,
        amount,
        memo: memo || "",
      }),
      required_auths: [sender],
      required_posting_auths: [],
    },
  ];
}

/**
 * Builds multiple Ecency point transfer operations for multiple recipients.
 * @param sender - Sender account
 * @param destinations - Comma or space separated list of recipients
 * @param amount - Amount to transfer
 * @param memo - Transfer memo
 * @returns Array of custom JSON operations for point transfers
 */
export function buildMultiPointTransferOps(
  sender: string,
  destinations: string,
  amount: string,
  memo: string
): Operation[] {
  if (!sender || !destinations || !amount) {
    throw new Error("[SDK][buildMultiPointTransferOps] Missing required parameters");
  }

  // Split the destination input into an array of usernames
  const destArray = destinations
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);

  // Create a point transfer operation for each destination
  return destArray.map((dest) =>
    buildPointTransferOp(sender, dest.trim(), amount, memo)
  );
}

/**
 * Builds an Ecency community rewards registration operation (custom_json).
 * @param name - Account name to register
 * @returns Custom JSON operation for community registration
 */
export function buildCommunityRegistrationOp(name: string): Operation {
  if (!name) {
    throw new Error("[SDK][buildCommunityRegistrationOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: "ecency_registration",
      json: JSON.stringify({
        name,
      }),
      required_auths: [name],
      required_posting_auths: [],
    },
  ];
}

/**
 * Builds a generic active authority custom_json operation.
 * Used for various Ecency operations that require active authority.
 * @param username - Account performing the operation
 * @param operationId - Custom JSON operation ID
 * @param json - JSON payload
 * @returns Custom JSON operation with active authority
 */
export function buildActiveCustomJsonOp(
  username: string,
  operationId: string,
  json: Record<string, any>
): Operation {
  if (!username || !operationId || !json) {
    throw new Error("[SDK][buildActiveCustomJsonOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: operationId,
      json: JSON.stringify(json),
      required_auths: [username],
      required_posting_auths: [],
    },
  ];
}

/**
 * Builds a generic posting authority custom_json operation.
 * Used for various operations that require posting authority.
 * @param username - Account performing the operation
 * @param operationId - Custom JSON operation ID
 * @param json - JSON payload
 * @returns Custom JSON operation with posting authority
 */
export function buildPostingCustomJsonOp(
  username: string,
  operationId: string,
  json: Record<string, any> | any[]
): Operation {
  if (!username || !operationId || !json) {
    throw new Error("[SDK][buildPostingCustomJsonOp] Missing required parameters");
  }

  return [
    "custom_json",
    {
      id: operationId,
      json: JSON.stringify(json),
      required_auths: [],
      required_posting_auths: [username],
    },
  ];
}
