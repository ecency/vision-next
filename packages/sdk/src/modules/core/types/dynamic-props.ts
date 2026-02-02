export interface DynamicProps {
  // Backward compatible transformed fields (camelCase, parsed)
  hivePerMVests: number;
  base: number;
  quote: number;
  fundRewardBalance: number;
  fundRecentClaims: number;
  hbdPrintRate: number;
  hbdInterestRate: number;
  headBlock: number;
  totalVestingFund: number;
  totalVestingShares: number;
  virtualSupply: number;
  vestingRewardPercent: number;
  accountCreationFee: string;

  // Raw blockchain data (snake_case, unparsed)
  // Includes ALL fields from blockchain without transformation
  raw?: {
    globalDynamic: Record<string, any>;
    feedHistory: Record<string, any>;
    chainProps: Record<string, any>;
    rewardFund: Record<string, any>;
  };
}
