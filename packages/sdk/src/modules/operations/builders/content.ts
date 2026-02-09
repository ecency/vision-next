import { Operation } from "@hiveio/dhive";

/**
 * Content Operations
 * Operations for creating, voting, and managing content on Hive blockchain
 */

/**
 * Builds a vote operation.
 * @param voter - Account casting the vote
 * @param author - Author of the post/comment
 * @param permlink - Permlink of the post/comment
 * @param weight - Vote weight (-10000 to 10000, where 10000 = 100% upvote, -10000 = 100% downvote)
 * @returns Vote operation
 */
export function buildVoteOp(
  voter: string,
  author: string,
  permlink: string,
  weight: number
): Operation {
  if (!voter || !author || !permlink) {
    throw new Error("[SDK][buildVoteOp] Missing required parameters");
  }
  if (weight < -10000 || weight > 10000) {
    throw new Error("[SDK][buildVoteOp] Weight must be between -10000 and 10000");
  }

  return [
    "vote",
    {
      voter,
      author,
      permlink,
      weight,
    },
  ];
}

/**
 * Builds a comment operation (for posts or replies).
 * @param author - Author of the comment/post
 * @param permlink - Permlink of the comment/post
 * @param parentAuthor - Parent author (empty string for top-level posts)
 * @param parentPermlink - Parent permlink (category/tag for top-level posts)
 * @param title - Title of the post (empty for comments)
 * @param body - Content body
 * @param jsonMetadata - JSON metadata object
 * @returns Comment operation
 */
export function buildCommentOp(
  author: string,
  permlink: string,
  parentAuthor: string,
  parentPermlink: string,
  title: string,
  body: string,
  jsonMetadata: Record<string, any>
): Operation {
  if (!author || !permlink || parentPermlink === undefined) {
    throw new Error("[SDK][buildCommentOp] Missing required parameters");
  }

  return [
    "comment",
    {
      parent_author: parentAuthor,
      parent_permlink: parentPermlink,
      author,
      permlink,
      title,
      body,
      json_metadata: JSON.stringify(jsonMetadata),
    },
  ];
}

/**
 * Builds a comment options operation (for setting beneficiaries, rewards, etc.).
 * @param author - Author of the comment/post
 * @param permlink - Permlink of the comment/post
 * @param maxAcceptedPayout - Maximum accepted payout (e.g., "1000000.000 HBD")
 * @param percentHbd - Percent of payout in HBD (10000 = 100%)
 * @param allowVotes - Allow votes on this content
 * @param allowCurationRewards - Allow curation rewards
 * @param extensions - Extensions array (for beneficiaries, etc.)
 * @returns Comment options operation
 */
export function buildCommentOptionsOp(
  author: string,
  permlink: string,
  maxAcceptedPayout: string,
  percentHbd: number,
  allowVotes: boolean,
  allowCurationRewards: boolean,
  extensions: any[]
): Operation {
  if (!author || !permlink) {
    throw new Error("[SDK][buildCommentOptionsOp] Missing required parameters");
  }

  return [
    "comment_options",
    {
      author,
      permlink,
      max_accepted_payout: maxAcceptedPayout,
      percent_hbd: percentHbd,
      allow_votes: allowVotes,
      allow_curation_rewards: allowCurationRewards,
      extensions,
    },
  ];
}

/**
 * Builds a delete comment operation.
 * @param author - Author of the comment/post to delete
 * @param permlink - Permlink of the comment/post to delete
 * @returns Delete comment operation
 */
export function buildDeleteCommentOp(author: string, permlink: string): Operation {
  if (!author || !permlink) {
    throw new Error("[SDK][buildDeleteCommentOp] Missing required parameters");
  }

  return [
    "delete_comment",
    {
      author,
      permlink,
    },
  ];
}

/**
 * Builds a reblog operation (custom_json).
 * @param account - Account performing the reblog
 * @param author - Original post author
 * @param permlink - Original post permlink
 * @param deleteReblog - If true, removes the reblog
 * @returns Custom JSON operation for reblog
 */
export function buildReblogOp(
  account: string,
  author: string,
  permlink: string,
  deleteReblog: boolean = false
): Operation {
  if (!account || !author || !permlink) {
    throw new Error("[SDK][buildReblogOp] Missing required parameters");
  }

  const json: any = {
    account,
    author,
    permlink,
  };

  if (deleteReblog) {
    json.delete = "delete";
  }

  return [
    "custom_json",
    {
      id: "follow",
      json: JSON.stringify(["reblog", json]),
      required_auths: [],
      required_posting_auths: [account],
    },
  ];
}
