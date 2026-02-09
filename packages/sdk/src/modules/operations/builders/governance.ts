import { Operation } from "@hiveio/dhive";

/**
 * Governance Operations
 * Operations for witness voting, proposals, and proxy management
 */

/**
 * Builds an account witness vote operation.
 * @param account - Account voting
 * @param witness - Witness account name
 * @param approve - True to approve, false to disapprove
 * @returns Account witness vote operation
 */
export function buildWitnessVoteOp(
  account: string,
  witness: string,
  approve: boolean
): Operation {
  if (!account || !witness || approve === undefined) {
    throw new Error("[SDK][buildWitnessVoteOp] Missing required parameters");
  }

  return [
    "account_witness_vote",
    {
      account,
      witness,
      approve,
    },
  ];
}

/**
 * Builds an account witness proxy operation.
 * @param account - Account setting proxy
 * @param proxy - Proxy account name (empty string to remove proxy)
 * @returns Account witness proxy operation
 */
export function buildWitnessProxyOp(account: string, proxy: string): Operation {
  if (!account || proxy === undefined) {
    throw new Error("[SDK][buildWitnessProxyOp] Missing required parameters");
  }

  return [
    "account_witness_proxy",
    {
      account,
      proxy,
    },
  ];
}

/**
 * Payload for proposal creation
 */
export interface ProposalCreatePayload {
  receiver: string;
  subject: string;
  permlink: string;
  start: string;
  end: string;
  dailyPay: string;
}

/**
 * Builds a create proposal operation.
 * @param creator - Account creating the proposal
 * @param payload - Proposal details
 * @returns Create proposal operation
 */
export function buildProposalCreateOp(
  creator: string,
  payload: ProposalCreatePayload
): Operation {
  if (!creator || !payload.receiver || !payload.subject || !payload.permlink) {
    throw new Error("[SDK][buildProposalCreateOp] Missing required parameters");
  }

  return [
    "create_proposal",
    {
      creator,
      receiver: payload.receiver,
      start_date: payload.start,
      end_date: payload.end,
      daily_pay: payload.dailyPay,
      subject: payload.subject,
      permlink: payload.permlink,
      extensions: [],
    },
  ];
}

/**
 * Builds an update proposal votes operation.
 * @param voter - Account voting
 * @param proposalIds - Array of proposal IDs
 * @param approve - True to approve, false to disapprove
 * @returns Update proposal votes operation
 */
export function buildProposalVoteOp(
  voter: string,
  proposalIds: number[],
  approve: boolean
): Operation {
  if (!voter || !proposalIds || proposalIds.length === 0 || approve === undefined) {
    throw new Error("[SDK][buildProposalVoteOp] Missing required parameters");
  }

  return [
    "update_proposal_votes",
    {
      voter,
      proposal_ids: proposalIds,
      approve,
      extensions: [],
    },
  ];
}

/**
 * Builds a remove proposal operation.
 * @param proposalOwner - Owner of the proposal
 * @param proposalIds - Array of proposal IDs to remove
 * @returns Remove proposal operation
 */
export function buildRemoveProposalOp(
  proposalOwner: string,
  proposalIds: number[]
): Operation {
  if (!proposalOwner || !proposalIds || proposalIds.length === 0) {
    throw new Error("[SDK][buildRemoveProposalOp] Missing required parameters");
  }

  return [
    "remove_proposal",
    {
      proposal_owner: proposalOwner,
      proposal_ids: proposalIds,
      extensions: [],
    },
  ];
}

/**
 * Builds an update proposal operation.
 * @param proposalId - Proposal ID to update
 * @param creator - Account that created the proposal
 * @param dailyPay - New daily pay amount
 * @param subject - New subject
 * @param permlink - New permlink
 * @returns Update proposal operation
 */
export function buildUpdateProposalOp(
  proposalId: number,
  creator: string,
  dailyPay: string,
  subject: string,
  permlink: string
): Operation {
  if (!proposalId || !creator || !dailyPay || !subject || !permlink) {
    throw new Error("[SDK][buildUpdateProposalOp] Missing required parameters");
  }

  return [
    "update_proposal",
    {
      proposal_id: proposalId,
      creator,
      daily_pay: dailyPay,
      subject,
      permlink,
      extensions: [],
    },
  ];
}
