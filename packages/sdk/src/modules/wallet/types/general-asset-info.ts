export interface GeneralAssetInfo {
  name: string;
  title: string;
  price: number;
  accountBalance: number;
  apr?: string;
  layer?: string;
  pendingRewards?: number;
  parts?: {
    name: string;
    balance: number;
  }[];
}
