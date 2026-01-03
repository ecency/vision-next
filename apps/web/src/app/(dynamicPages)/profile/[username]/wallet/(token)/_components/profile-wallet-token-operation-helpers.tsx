import { AssetOperation } from "@ecency/wallets";
import {
  UilArrowDownRight,
  UilArrowRight,
  UilArrowsHAlt,
  UilBoltAlt,
  UilChartBar,
  UilCodeBranch,
  UilGift,
  UilLock,
  UilMoneybag,
  UilPlus,
  UilUnlock,
  UilUserPlus,
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { ReactNode } from "react";

export const profileWalletOperationIcons: Partial<Record<AssetOperation, ReactNode>> = {
  [AssetOperation.Transfer]: <UilArrowRight />,
  [AssetOperation.TransferToSavings]: <UilMoneybag />,
  [AssetOperation.PowerUp]: <UilBoltAlt />,
  [AssetOperation.PowerDown]: <UilArrowDownRight />,
  [AssetOperation.WithdrawRoutes]: <UilCodeBranch />,
  [AssetOperation.WithdrawFromSavings]: <UilArrowDownRight />,
  [AssetOperation.Delegate]: <UilUserPlus />,
  [AssetOperation.Swap]: <UilArrowsHAlt />,
  [AssetOperation.Gift]: <UilGift />,
  [AssetOperation.Promote]: <UilChartBar />,
  [AssetOperation.Claim]: <UilPlus />,
  [AssetOperation.Buy]: <UilBoltAlt />,
  [AssetOperation.LockLiquidity]: <UilLock />,
  [AssetOperation.Stake]: <UilLock />,
  [AssetOperation.Unstake]: <UilUnlock />,
  [AssetOperation.ClaimInterest]: <UilMoneybag />,
};

export function getProfileWalletOperationLabel(operation: AssetOperation) {
  if (operation === AssetOperation.WithdrawFromSavings) {
    return i18next.t("transfer.withdraw-saving-title");
  }

  if (operation === AssetOperation.ClaimInterest) {
    return i18next.t("transfer.claim-interest-title");
  }

  if (operation === AssetOperation.WithdrawRoutes) {
    return i18next.t("profile-wallet.operations.withdraw-saving");
  }

  return i18next.t(`profile-wallet.operations.${operation}`);
}
