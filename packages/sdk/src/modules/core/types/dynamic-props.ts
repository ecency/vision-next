export interface DynamicProps {
  // Backward compatible transformed fields (camelCase, parsed)
  hivePerMVests: number;
  base: number;
  quote: number;
  fundRewardBalance: number;
  fundRecentClaims: number;
  votePowerReserveRate: number;
  authorRewardCurve: string;
  contentConstant: number;
  currentHardforkVersion: string;
  lastHardfork: number;
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
    hardforkProps: Record<string, any>;
  };
}
