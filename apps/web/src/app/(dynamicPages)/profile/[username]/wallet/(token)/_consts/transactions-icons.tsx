import { PointTransactionType } from "@ecency/sdk";
import {
  UilArrowCircleUp,
  UilArrowDownRight,
  UilArrowUpRight,
  UilCommentAdd,
  UilLock,
  UilPen,
  UilPlusCircle,
  UilRepeat,
  UilStar,
  UilUser,
  UilUserPlus,
  UilUsersAlt
} from "@tooni/iconscout-unicons-react";
import { ReactNode } from "react";

export const TRANSACTIONS_ICONS: Record<string | number, ReactNode> = {
  [PointTransactionType.CHECKIN]: <UilStar className="w-4 h-4" />,
  [PointTransactionType.CHECKIN_EXTRA]: <UilStar className="w-4 h-4" />,
  [PointTransactionType.COMMENT]: <UilCommentAdd className="w-4 h-4" />,
  [PointTransactionType.COMMUNITY]: <UilUsersAlt className="w-4 h-4" />,
  [PointTransactionType.DELEGATION]: <UilUserPlus className="w-4 h-4" />,
  [PointTransactionType.LOGIN]: <UilUser className="w-4 h-4" />,
  [PointTransactionType.MINTED]: <UilLock className="w-4 h-4" />,
  [PointTransactionType.POST]: <UilPen className="w-4 h-4" />,
  [PointTransactionType.REBLOG]: <UilRepeat className="w-4 h-4" />,
  [PointTransactionType.REFERRAL]: <UilPlusCircle className="w-4 h-4" />,
  [PointTransactionType.TRANSFER_INCOMING]: <UilArrowDownRight className="w-4 h-4" />,
  [PointTransactionType.TRANSFER_SENT]: <UilArrowUpRight className="w-4 h-4" />,
  [PointTransactionType.VOTE]: <UilArrowCircleUp className="w-4 h-4" />
};
