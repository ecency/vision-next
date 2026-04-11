export interface VestingDelegationExpiration {
  id: number;
  delegator: string;
  vesting_shares: {
    amount: string;
    nai: string;
    precision: number;
  };
  expiration: string;
}
