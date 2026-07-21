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
  <UilHistory className="size-4" />
);

export const HiveEngineOperationIcon: Record<string, ReactNode> = {
  tokens_transfer: <UilArrowUpRight className="size-4" />,
  tokens_stake: <UilMoneyBillStack className="size-4" />,
  tokens_issue: <UilArrowDownRight className="size-4" />,
  comments_authorReward: <UilMoneyBill className="size-4" />,
  comments_beneficiaryReward: <UilMoneyBill className="size-4" />,
  comments_authorReward_stake: <UilMoneyBill className="size-4" />,
  comments_curationReward: <UilMoneyBill className="size-4" />,
  comments_curationReward_stake: <UilMoneyBillStack className="size-4" />,
  market_buy: <UilShoppingCart className="size-4" />,
  market_placeOrder: <UilClipboardNotes className="size-4" />,
  market_closeOrder: <UilCheckCircle className="size-4" />,
  distribution_pending: <UilClock className="size-4" />
};
