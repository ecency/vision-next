/**
 * Shape returned by the HAF balance-api delegations endpoint
 * (`/balance-api/accounts/{account-name}/delegations`).
 *
 * `amount` is raw vests as an integer string (vests * 10^6),
 * e.g. "903311000000" === 903311.000000 VESTS.
 */
export interface OutgoingDelegation {
  delegatee: string;
  amount: string;
  operation_id: string;
  block_num: number;
}

export interface IncomingDelegation {
  delegator: string;
  amount: string;
  operation_id: string;
  block_num: number;
}

export interface AccountDelegations {
  outgoing_delegations: OutgoingDelegation[];
  incoming_delegations: IncomingDelegation[];
}
