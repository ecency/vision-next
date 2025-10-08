export interface RcStats {
  block: number;
  budget: number[];
  comment: number;
  ops: Ops;
  payers: Payer[];
  pool: number[];
  regen: number;
  share: number[];
  stamp: string;
  transfer: number;
  vote: number;
}

interface Ops {
  account_create_operation: OperationCost;
  account_update2_operation: OperationCost;
  account_update_operation: OperationCost;
  account_witness_proxy_operation: OperationCost;
  account_witness_vote_operation: OperationCost;
  cancel_transfer_from_savings_operation: OperationCost;
  change_recovery_account_operation: OperationCost;
  claim_account_operation: OperationCost;
  claim_reward_balance_operation: OperationCost;
  collateralized_convert_operation: OperationCost;
  comment_operation: OperationCost;
  comment_options_operation: OperationCost;
  convert_operation: OperationCost;
  create_claimed_account_operation: OperationCost;
  custom_json_operation: OperationCost;
  delegate_vesting_shares_operation: OperationCost;
  delete_comment_operation: OperationCost;
  feed_publish_operation: OperationCost;
  limit_order_cancel_operation: OperationCost;
  limit_order_create_operation: OperationCost;
  multiop: OperationCost;
  recover_account_operation: OperationCost;
  recurrent_transfer_operation: OperationCost;
  request_account_recovery_operation: OperationCost;
  set_withdraw_vesting_route_operation: OperationCost;
  transfer_from_savings_operation: OperationCost;
  transfer_operation: OperationCost;
  transfer_to_savings_operation: OperationCost;
  transfer_to_vesting_operation: OperationCost;
  update_proposal_votes_operation: OperationCost;
  vote_operation: OperationCost;
  withdraw_vesting_operation: OperationCost;
  witness_set_properties_operation: OperationCost;
  witness_update_operation: OperationCost;
}

interface OperationCost {
  avg_cost: number;
  count: number;
}

export interface Payer {
  cant_afford?: CantAfford;
  count: number;
  lt10?: number;
  lt20?: number;
  lt5?: number;
  rank: number;
}

export interface CantAfford {
  comment: number;
  transfer: number;
  vote: number;
}
