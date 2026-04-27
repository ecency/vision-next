export interface DynamicProps {
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
}
