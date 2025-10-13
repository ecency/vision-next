import {
  UilArrowDownRight,
  UilArrowUpRight,
  UilCheckCircle,
  UilClipboardNotes,
  UilClock,
  UilHistory,
  UilMoneyBill,
  UilMoneyBillStack,
  UilShoppingCart
} from "@tooni/iconscout-unicons-react";
import { ReactNode } from "react";

export const DEFAULT_HIVE_ENGINE_OPERATION_ICON = (
  <UilHistory className="w-4 h-4" />
);

export const HiveEngineOperationIcon: Record<string, ReactNode> = {
  tokens_transfer: <UilArrowUpRight className="w-4 h-4" />,
  tokens_stake: <UilMoneyBillStack className="w-4 h-4" />,
  tokens_issue: <UilArrowDownRight className="w-4 h-4" />,
  comments_authorReward: <UilMoneyBill className="w-4 h-4" />,
  comments_beneficiaryReward: <UilMoneyBill className="w-4 h-4" />,
  comments_authorReward_stake: <UilMoneyBill className="w-4 h-4" />,
  comments_curationReward: <UilMoneyBill className="w-4 h-4" />,
  comments_curationReward_stake: <UilMoneyBillStack className="w-4 h-4" />,
  market_buy: <UilShoppingCart className="w-4 h-4" />,
  market_placeOrder: <UilClipboardNotes className="w-4 h-4" />,
  market_closeOrder: <UilCheckCircle className="w-4 h-4" />,
  distribution_pending: <UilClock className="w-4 h-4" />
};
