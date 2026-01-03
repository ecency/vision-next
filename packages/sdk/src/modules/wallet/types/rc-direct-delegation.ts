export interface RcDirectDelegation {
  from: string;
  to: string;
  delegated_rc: string;
}

export interface RcDirectDelegationsResponse {
  rc_direct_delegations: RcDirectDelegation[];
  next_start?: [string, string] | null;
}
