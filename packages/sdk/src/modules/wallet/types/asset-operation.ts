export enum AssetOperation {
  // Common
  Transfer = "transfer",

  // APR
  TransferToSavings = "transfer-saving",
  WithdrawFromSavings = "withdraw-saving",
  Delegate = "delegate",
  PowerUp = "power-up",
  PowerDown = "power-down",
  WithdrawRoutes = "withdraw-routes",
  ClaimInterest = "claim-interest",
  Swap = "swap",
  Convert = "convert",

  // Points
  Gift = "gift",
  Promote = "promote",
  Claim = "claim",
  Buy = "buy",

  // SPK
  LockLiquidity = "lock",

  // Layer 2
  Stake = "stake",
  Unstake = "unstake",
  Undelegate = "undelegate",
}
