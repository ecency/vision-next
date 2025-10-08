import { PointTransactionType } from "./point-transaction-type";

export interface PointTransaction {
  id: number;
  type: PointTransactionType;
  created: string;
  memo: string | null;
  amount: string;
  sender: string | null;
  receiver: string | null;
}
