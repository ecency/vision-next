import { AssetOperation } from "@ecency/sdk";
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
  UilUserMinus,
  UilUserPlus,
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { ReactNode } from "react";

export const profileWalletOperationIcons: Partial<Record<AssetOperation, ReactNode>> = {
  [AssetOperation.Transfer]: <UilArrowRight className="size-6" />,
  [AssetOperation.TransferToSavings]: <UilMoneybag className="size-6" />,
  [AssetOperation.PowerUp]: <UilBoltAlt className="size-6" />,
  [AssetOperation.PowerDown]: <UilArrowDownRight className="size-6" />,
  [AssetOperation.WithdrawRoutes]: <UilCodeBranch className="size-6" />,
  [AssetOperation.WithdrawFromSavings]: <UilArrowDownRight className="size-6" />,
  [AssetOperation.Delegate]: <UilUserPlus className="size-6" />,
  [AssetOperation.Undelegate]: <UilUserMinus className="size-6" />,
  [AssetOperation.Swap]: <UilArrowsHAlt className="size-6" />,
  [AssetOperation.Convert]: <UilArrowsHAlt className="size-6" />,
  [AssetOperation.Gift]: <UilGift className="size-6" />,
  [AssetOperation.Promote]: <UilChartBar className="size-6" />,
  [AssetOperation.Claim]: <UilPlus className="size-6" />,
  [AssetOperation.Buy]: <UilBoltAlt className="size-6" />,
  [AssetOperation.Stake]: <UilLock className="size-6" />,
  [AssetOperation.Unstake]: <UilUnlock className="size-6" />,
  [AssetOperation.ClaimInterest]: <UilMoneybag className="size-6" />,
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
